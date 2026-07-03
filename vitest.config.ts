import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@src": path.resolve(__dirname, "src"),
      "@app": path.resolve(__dirname, "src/OscSheet/app"),
      "@layout": path.resolve(__dirname, "src/OscSheet/layout"),
      "@features": path.resolve(__dirname, "src/OscSheet/features"),
      "@domain": path.resolve(__dirname, "src/OscSheet/domain"),
      "@ui": path.resolve(__dirname, "src/OscSheet/components/ui"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "tools/**/*.test.ts"],
  },
});
