import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  // Covers ui + layout + features (the old Ladle glob missed layout/features).
  stories: ["../src/OscSheet/**/*.stories.@(tsx|mdx)"],
  addons: [
    "@storybook/addon-a11y", // accessibility audit panel — catches contrast/aria
  ],
  framework: {
    name: "@storybook/react-vite",
    // Don't auto-load the root vite.config.ts — its foundry-vtt-react plugin
    // proxies module requests to Foundry (:30000), breaking `storybook dev`.
    options: { builder: { viteConfigPath: ".storybook/vite.config.ts" } },
  },
  // Storybook auto-loads root postcss.config.mjs (the Vellum scoper) — nothing to wire.
  viteFinal: (cfg) =>
    mergeConfig(cfg, {
      // The app build (root vite.config.ts) bakes __MODULE_ID__; Storybook doesn't
      // load that config, so define it here or any story importing flags.ts (theme/
      // fontScale → the settings modal) crashes with "__MODULE_ID__ is not defined".
      define: { __MODULE_ID__: JSON.stringify("osc-character-sheet") },
      plugins: [react(), svgr()],
      resolve: {
        // Mirror vite.config.ts aliases so layout/features stories resolve.
        alias: {
          "@src": path.resolve(dirname, "../src"),
          "@app": path.resolve(dirname, "../src/OscSheet/app"),
          "@layout": path.resolve(dirname, "../src/OscSheet/layout"),
          "@features": path.resolve(dirname, "../src/OscSheet/features"),
          "@domain": path.resolve(dirname, "../src/OscSheet/domain"),
          "@ui": path.resolve(dirname, "../src/OscSheet/components/ui"),
        },
      },
    }),
};
export default config;
