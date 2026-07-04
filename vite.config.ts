import { defineConfig, mergeConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import foundryReact from "foundry-vtt-react/vite";
import svgr from "vite-plugin-svgr";
import fs from "node:fs";
import path from "path";

// foundryReact() owns the Foundry-specific config (base, root, server.proxy,
// build input/output) — derived from module.json. Only app-specific config lives here.
const config: UserConfig = {
  plugins: [react(), foundryReact(), svgr()],
  define: {
    "process.env": {},
    // Strip @sentry/browser's internal debug logging: smaller lazy chunk, and
    // transport failures (offline/air-gapped worlds) stay silent in console.
    __SENTRY_DEBUG__: false,
  },
  resolve: {
    // Note: react/react-dom dedupe is handled by foundryReact() — no need to set it here.
    alias: {
      // Allow absolute imports from the src directory
      "@src": path.resolve(__dirname, "src"),
      // Layer aliases — mirror the sheet's architecture (docs/trim-the-fat-plan.md)
      "@app": path.resolve(__dirname, "src/OscSheet/app"),
      "@layout": path.resolve(__dirname, "src/OscSheet/layout"),
      "@features": path.resolve(__dirname, "src/OscSheet/features"),
      "@domain": path.resolve(__dirname, "src/OscSheet/domain"),
      "@ui": path.resolve(__dirname, "src/OscSheet/components/ui"),
    },
  },
  // foundryReact() moves root to src/, which silently moves the env-file dir
  // too — pin it back so .env.local (VITE_SENTRY_DSN) at the repo root loads.
  envDir: __dirname,
  build: {
    sourcemap: true,
  },
  server: {
    open: true,
  },
};

// Uncommitted local overrides (gitignored). Drop a partial Vite config in
// vite.config.local.json — e.g. {"server":{"allowedHosts":["foo.ngrok-free.app"]}} —
// and it's deep-merged on top. Arrays (like allowedHosts) are concatenated.
const localPath = path.resolve(__dirname, "vite.config.local.json");
const local: UserConfig = fs.existsSync(localPath)
  ? (JSON.parse(fs.readFileSync(localPath, "utf8")) as UserConfig)
  : {};

export default defineConfig(mergeConfig(config, local));
