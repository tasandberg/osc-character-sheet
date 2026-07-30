import { chromium, type FullConfig } from "@playwright/test";
import { joinAsGM, gmUserName, observerUserName } from "./helpers";

const URL = (process.env.FOUNDRY_URL || "http://localhost:30000").replace(/\/$/, "");
const MODULE_ID = "osc-character-sheet";

/**
 * Before any spec runs: enable the osc-character-sheet module (the world fixture ships
 * none enabled), then seed one passwordless GM + one passwordless OBSERVER player per
 * parallel slot. Actors are per-test (see the `fighter` fixture); users can't be, because
 * a Foundry user's hotbar / assigned character / flags are shared by every session of
 * that user — which is what made two workers collide.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
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

    const slots = Math.max(1, config.workers);
    const names = Array.from({ length: slots }, (_, i) => ({
      gm: gmUserName(i),
      observer: observerUserName(i),
    }));

    // Idempotent: recreate the slot users each run so stale state can't leak in.
    await page.evaluate(async (users) => {
      const g = globalThis as any;
      for (const { gm, observer } of users) {
        for (const [name, role] of [
          [gm, g.CONST.USER_ROLES.GAMEMASTER],
          [observer, g.CONST.USER_ROLES.PLAYER],
        ] as const) {
          const existing = g.game.users.getName(name);
          if (existing) await existing.delete();
          await g.User.create({ name, role });
        }
      }
    }, names);

    const ok = await page.evaluate(
      ({ users, mod }) => {
        const g = globalThis as any;
        return (
          !!g.game.modules.get(mod)?.active &&
          users.every((u: any) => g.game.users.getName(u.gm) && g.game.users.getName(u.observer))
        );
      },
      { users: names, mod: MODULE_ID },
    );
    if (!ok) throw new Error("Module not active, or slot users were not created");
    console.log(`[global-setup] ${MODULE_ID} enabled, ${slots} user slot(s) seeded at ${URL}`);
  } finally {
    await page.close();
    await browser.close();
  }
}
