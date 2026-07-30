import { test as base, expect, type Page } from "@playwright/test";
import { joinAsUser, closeDialogs, gmUserName, observerUserName } from "./helpers";

const SHEET_CLASS = "ose.OscSheet";

/** A fighter owned by exactly one test: unique actor, unique weapon name. */
export type Fighter = {
  name: string;
  id: string;
  /** Tagged per test — OSE names the hotbar macro after the item, and macros are world-global. */
  weapon: string;
  armor: string;
  /** Untagged: the sheet classifies coins by item name ("Gold piece" -> gp). */
  coin: string;
};

/**
 * Foundry's `game.ready` boot (~40s on a 2-core CI runner under software WebGL)
 * dominates each spec, so the two sessions stay worker-scoped and every test in the
 * worker reuses them. Isolation comes from the data instead:
 *
 *  - Each parallel slot joins as its OWN seeded GM and observer user. Sessions of one
 *    Foundry user share that user's hotbar, assigned character and flags, so reusing
 *    "Gamemaster" across workers made specs stomp each other (the #113 2-worker flake).
 *  - Each TEST gets its own `fighter` actor, created and deleted by the fixture, with a
 *    tagged weapon name so the macro it drops onto the hotbar is its own document.
 */
export const test = base.extend<
  { fighter: Fighter },
  { gamePage: Page; observerPage: Page; slot: number }
>({
  slot: [async ({}, use, workerInfo) => use(workerInfo.parallelIndex), { scope: "worker" }],

  gamePage: [
    async ({ browser, slot }, use) => {
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
      });
      const page = await context.newPage();
      await joinAsUser(page, gmUserName(slot));
      await use(page);
      await context.close();
    },
    { scope: "worker" },
  ],

  // The second user: view-only permission on this test's fighter, driving the
  // read-only-sheet spec. Worker-scoped for the same boot-cost reason as `gamePage`.
  observerPage: [
    async ({ browser, slot }, use) => {
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
      });
      const page = await context.newPage();
      await joinAsUser(page, observerUserName(slot));
      await use(page);
      await context.close();
    },
    { scope: "worker" },
  ],

  fighter: async ({ gamePage, slot }, use, testInfo) => {
    const tag = `${slot}-${testInfo.testId}-${testInfo.repeatEachIndex}`;
    const fighter: Fighter = {
      name: `E2E Fighter ${tag}`,
      id: "",
      weapon: `Dagger ${tag}`,
      armor: "Leather Armor",
      coin: "Gold piece",
    };

    fighter.id = await gamePage.evaluate(
      async ({ f, observer, sheetClass }) => {
        const g = globalThis as any;
        const observerId = g.game.users.getName(observer)?.id;
        if (!observerId) throw new Error(`Observer user "${observer}" not seeded`);
        // One atomic create: items and the sheetClass flag are part of the payload,
        // never follow-up updates. A later `flags.core.sheetClass` update fires
        // ClientDocument#_onSheetChange on EVERY client holding the actor, closing
        // its open sheet and re-rendering a fresh one. Reaching the slow observer
        // session mid-spec, that detached the sheet under Playwright's cursor.
        const actor = await g.Actor.create({
          name: f.name,
          type: "character",
          // OBSERVER (2): can view the sheet, cannot edit. Set at creation so the
          // observer session never sees a permission-less intermediate state.
          ownership: { [observerId]: g.CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
          flags: { core: { sheetClass } },
          items: [
            {
              name: f.weapon,
              type: "weapon",
              // Equipped so it appears in the Attacks table (selectAttacks skips
              // unequipped weapons). The equip spec toggles the armor, not this.
              system: {
                damage: "1d4",
                melee: true,
                missile: true,
                equipped: true,
                quantity: { value: 1 },
              },
            },
            { name: f.armor, type: "armor", system: { equipped: false } },
            {
              name: f.coin,
              type: "item",
              system: { treasure: true, quantity: { value: 50 } },
            },
          ],
        });
        return actor.id as string;
      },
      { f: fighter, observer: observerUserName(slot), sheetClass: SHEET_CLASS },
    );

    await use(fighter);

    // Drop everything this test named: the actor (closing its sheets) and any hotbar
    // macro OSE created for its weapon.
    await gamePage
      .evaluate(async ({ id, weapon }) => {
        const g = globalThis as any;
        for (const m of g.game.macros.filter((x: any) => x.name === weapon)) await m.delete();
        for (const s of g.game.user.getHotbarMacros?.() ?? [])
          if (s?.macro) await g.game.user.unassignHotbarMacro(s.slot);
        await g.game.actors.get(id)?.delete();
      }, fighter)
      .catch(() => {});
  },
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
