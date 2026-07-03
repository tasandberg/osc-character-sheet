import type { Page, Locator } from "@playwright/test";

export const ACTOR_NAME = "E2E Fighter";
const URL = (process.env.FOUNDRY_URL || "http://localhost:30000").replace(/\/$/, "");

declare const game: any;
declare const foundry: any;
declare const Actor: any;

/** Join the running world as the passwordless Gamemaster and wait for game.ready. */
export async function joinAsGM(page: Page): Promise<void> {
  await page.goto(`${URL}/join`, { waitUntil: "domcontentloaded" });
  const userSelect = page.locator('select[name="userid"]');
  await userSelect.waitFor({ timeout: 30_000 });
  // Options for already-connected users are disabled client-side only; re-enable first.
  await page.evaluate(() => {
    for (const o of document.querySelectorAll('select[name="userid"] option'))
      (o as HTMLOptionElement).disabled = false;
  });
  await userSelect.selectOption({ label: "Gamemaster" });
  await page.click('button[name="join"]');
  await page.waitForFunction(() => (globalThis as any).game?.ready === true, null, {
    timeout: 120_000,
  });
}

/**
 * Open the seeded actor's sheet and return its root locator. The OSC sheet
 * registers under `ose.OscSheet` with makeDefault, and global-setup pins the
 * actor's core.sheetClass flag, so render() shows the OSC sheet.
 */
export async function openCharacterSheet(page: Page): Promise<Locator> {
  await page.evaluate(async (name) => {
    const g = globalThis as any;
    // Foundry parks a persistent #notifications overlay (min-resolution warning
    // under headless) over the sheet, intercepting clicks. Let pointer events
    // pass through it (inject once) and clear queued toasts.
    if (!document.getElementById("__e2e_notif_css")) {
      const s = document.createElement("style");
      s.id = "__e2e_notif_css";
      s.textContent = "#notifications{pointer-events:none !important}";
      document.head.appendChild(s);
    }
    g.ui?.notifications?.clear?.();

    const actor = g.game.actors.getName(name);
    if (!actor) throw new Error(`Seed actor "${name}" not found`);
    // Rendering this React sheet is the expensive step on a 2-core runner, so
    // render only once and reuse it across specs (the shared session keeps it up).
    if (!actor.sheet.rendered) await actor.sheet.render(true);
    // First render races: the render() promise can resolve before the element is
    // attached, and setPosition() calls getComputedStyle() on it. Wait for it.
    for (let i = 0; i < 60 && !(actor.sheet.element instanceof HTMLElement); i++)
      await new Promise((r) => setTimeout(r, 50));
    // Force the wide (large) layout tier so the horizontal tab bar renders.
    actor.sheet.setPosition?.({ width: 920, height: 820 });
  }, ACTOR_NAME);
  const sheet = page.locator(".osc-sheet").first();
  await sheet.waitFor({ state: "visible", timeout: 30_000 });
  return sheet;
}

/**
 * Reset between specs that share one booted page + one open sheet: close any roll
 * dialogs left over from a spec, but leave the OSC sheet itself open (so the
 * next spec reuses the render) and Foundry's core UI alone.
 */
export async function closeDialogs(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const app of (globalThis as any).foundry.applications.instances.values()) {
      const el = app.element as HTMLElement | undefined;
      const isDialog =
        el?.classList?.contains("dialog") || /Dialog/i.test(app.constructor?.name ?? "");
      if (isDialog) app.close?.();
    }
  });
}

/** Current number of chat messages in the world. */
export async function chatCount(page: Page): Promise<number> {
  return page.evaluate(() => (globalThis as any).game.messages.size);
}

/** Read a value off the seeded actor by dot-path (e.g. "system.scores.str.value"). */
export async function actorGet(page: Page, path: string): Promise<unknown> {
  return page.evaluate(
    ({ name, p }) => {
      const actor = (globalThis as any).game.actors.getName(name);
      return (globalThis as any).foundry.utils.getProperty(actor, p);
    },
    { name: ACTOR_NAME, p: path },
  );
}

/** Embedded item id on the seeded actor, by item name. */
export async function itemId(page: Page, name: string): Promise<string> {
  const id = await page.evaluate(
    ({ actor, item }) => {
      const a = (globalThis as any).game.actors.getName(actor);
      return a?.items.getName(item)?.id ?? null;
    },
    { actor: ACTOR_NAME, item: name },
  );
  if (!id) throw new Error(`Item "${name}" not found on ${ACTOR_NAME}`);
  return id as string;
}

/** Read a value off an embedded item by name + dot-path. */
export async function itemGet(page: Page, name: string, path: string): Promise<unknown> {
  return page.evaluate(
    ({ actor, item, p }) => {
      const a = (globalThis as any).game.actors.getName(actor);
      const it = a?.items.getName(item);
      return (globalThis as any).foundry.utils.getProperty(it, p);
    },
    { actor: ACTOR_NAME, item: name, p: path },
  );
}

/**
 * OSE roll buttons open a DialogV2 roll-config ("Strength check", "Death Poison
 * Save", …) whose primary "Roll" button is `[data-action="ok"]`. Wait briefly for
 * it and click Roll. No-ops for rolls that post directly (no dialog).
 */
export async function confirmRollDialogIfPresent(page: Page): Promise<void> {
  const ok = page.locator('.application.dialog button[data-action="ok"]').first();
  await ok.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {});
  if (await ok.isVisible().catch(() => false)) await ok.click().catch(() => {});
}
