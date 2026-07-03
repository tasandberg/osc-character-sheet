import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  // Covers ui + layout + features (the old Ladle glob missed layout/features).
  stories: ["../src/ReactorSheet/**/*.stories.@(tsx|mdx)"],
  addons: [
    "@storybook/addon-a11y", // accessibility audit panel — catches contrast/aria
  ],
  framework: { name: "@storybook/react-vite", options: {} },
  // Storybook auto-loads root postcss.config.mjs (the Vellum scoper) — nothing to wire.
  viteFinal: (cfg) =>
    mergeConfig(cfg, {
      plugins: [react(), svgr()],
      resolve: {
        // Mirror vite.config.ts aliases so layout/features stories resolve.
        alias: {
          "@src": path.resolve(dirname, "../src"),
          "@app": path.resolve(dirname, "../src/ReactorSheet/app"),
          "@layout": path.resolve(dirname, "../src/ReactorSheet/layout"),
          "@features": path.resolve(dirname, "../src/ReactorSheet/features"),
          "@domain": path.resolve(dirname, "../src/ReactorSheet/domain"),
          "@ui": path.resolve(dirname, "../src/ReactorSheet/components/ui"),
        },
      },
    }),
};
export default config;
