import { chromium, type FullConfig } from "@playwright/test";
import { joinAsGM, ACTOR_NAME } from "./helpers";

const URL = (process.env.FOUNDRY_URL || "http://localhost:30000").replace(/\/$/, "");
const MODULE_ID = "osc-character-sheet";
const SHEET_CLASS = "ose.ReactorSheet";

/**
 * Before any spec runs: join as GM, enable the osc-character-sheet module (the world
 * fixture ships none enabled), then seed a known "E2E Fighter" character with a
 * weapon, armor and coins, pinned to the reactor sheet. Specs assume this actor.
 */
export default async function globalSetup(_config: FullConfig): Promise<void> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  try {
    await joinAsGM(page);

    // Enable the module + reload so its `ready` hook registers the sheet class.
    const active = await page.evaluate(
      (m) => !!(globalThis as any).game?.modules?.get(m)?.active,
      MODULE_ID,
    );
    if (!active) {
      await page.evaluate(async (mod) => {
        const g = globalThis as any;
        const cfg = g.foundry.utils.deepClone(
          g.game.settings.get("core", "moduleConfiguration") || {},
        );
        cfg[mod] = true;
        await g.game.settings.set("core", "moduleConfiguration", cfg);
      }, MODULE_ID);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => (globalThis as any).game?.ready === true, null, {
        timeout: 120_000,
      });
    }

    // Seed the fixture actor (idempotent: remove a prior one first).
    await page.evaluate(
      async ({ name, sheetClass }) => {
        const g = globalThis as any;
        const existing = g.game.actors.getName(name);
        if (existing) await existing.delete();

        const actor = await g.Actor.create({ name, type: "character" });
        await actor.createEmbeddedDocuments("Item", [
          {
            name: "Dagger",
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
          {
            name: "Leather Armor",
            type: "armor",
            system: { equipped: false },
          },
          {
            name: "Gold piece",
            type: "item",
            system: { treasure: true, quantity: { value: 50 } },
          },
        ]);
        await actor.setFlag("core", "sheetClass", sheetClass);
      },
      { name: ACTOR_NAME, sheetClass: SHEET_CLASS },
    );

    // Sanity: actor exists and resolves the reactor sheet class.
    const ok = await page.evaluate((name) => {
      const actor = (globalThis as any).game.actors.getName(name);
      return !!actor && actor.items.size >= 3;
    }, ACTOR_NAME);
    if (!ok) throw new Error("Seed actor was not created with its items");
    console.log(`[global-setup] seeded "${ACTOR_NAME}" at ${URL}`);
  } finally {
    await page.close();
    await browser.close();
  }
}
