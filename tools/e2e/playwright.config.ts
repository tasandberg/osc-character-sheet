import { defineConfig, devices } from "@playwright/test";

// All workers share one Foundry world (one license, one server), so isolation is per
// test rather than per server: each parallel slot joins as its own seeded GM/observer
// user and each test owns its own actor (see fixtures.ts). That makes the specs
// order-independent, so `fullyParallel` spreads tests — not just files — across workers.
// The CI workflow boots Foundry and activates the world before invoking `playwright
// test`; globalSetup enables the module and seeds the per-slot users.
const BASE_URL = process.env.FOUNDRY_URL || "http://localhost:30000";

export default defineConfig({
  testDir: "./specs",
  globalSetup: "./global-setup.ts",
  fullyParallel: true,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  // Foundry ops run far slower on the free shared CI runners (sheet render, roll
  // dialogs) under software WebGL, so give each spec generous headroom there.
  timeout: process.env.CI ? 150_000 : 60_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: BASE_URL,
    headless: true,
    viewport: { width: 1920, height: 1080 },
    actionTimeout: process.env.CI ? 30_000 : 15_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Software WebGL so the headless canvas boots (Foundry needs a WebGL context);
    // --disable-dev-shm-usage avoids /dev/shm throttling/crashes under CI memory pressure.
    launchOptions: { args: ["--enable-unsafe-swiftshader", "--disable-dev-shm-usage"] },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
