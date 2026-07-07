import { test as base, expect, type Page } from "@playwright/test";
import { joinAsGM, joinAsUser, closeDialogs, OBSERVER_NAME } from "./helpers";

/**
 * Foundry's `game.ready` boot (~40s on a 2-core CI runner under software WebGL)
 * dominates each spec. Booting per test would pay it 7×. Instead a worker-scoped
 * page joins once and every spec reuses that booted session — global-setup has
 * already enabled the module and seeded the actor, so the world is ready.
 *
 * Specs share this page, so they aren't isolated: afterEach closes the sheet and
 * any roll dialog to stop UI bleeding between them. They already share one worker
 * and one seeded actor, and their assertions are written relatively
 * (before/after counts, !wasEquipped), so order independence holds.
 *
 * `observerPage` is the second user: its own context/page joined as the seeded
 * passwordless OBSERVER player (view-only permission on the fixture actor). It
 * drives the read-only-sheet spec. Kept worker-scoped for the same boot-cost
 * reason as `gamePage`.
 */
export const test = base.extend<object, { gamePage: Page; observerPage: Page }>({
  gamePage: [
    async ({ browser }, use) => {
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
      });
      const page = await context.newPage();
      await joinAsGM(page);
      await use(page);
      await context.close();
    },
    { scope: "worker" },
  ],
  observerPage: [
    async ({ browser }, use) => {
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
      });
      const page = await context.newPage();
      await joinAsUser(page, OBSERVER_NAME);
      await use(page);
      await context.close();
    },
    { scope: "worker" },
  ],
});

test.afterEach(async ({ gamePage }, testInfo) => {
  // Preserve a screenshot on failure (the shared page skips Playwright's
  // per-test auto-capture tied to the built-in `page` fixture).
  if (testInfo.status !== testInfo.expectedStatus) {
    await gamePage
      .screenshot({ path: testInfo.outputPath("failure.png"), fullPage: true })
      .then((buf) => testInfo.attach("failure", { body: buf, contentType: "image/png" }))
      .catch(() => {});
  }
  await closeDialogs(gamePage);
});

export { expect };
