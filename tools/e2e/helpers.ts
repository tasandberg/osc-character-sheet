import type { Page, Locator } from "@playwright/test";

/** Per-parallel-slot users, seeded by global-setup. Sessions of the SAME Foundry user
 *  share a hotbar, `user.character` and flags, so each slot needs its own pair. */
export const gmUserName = (slot: number) => `E2E GM ${slot}`;
export const observerUserName = (slot: number) => `E2E Observer ${slot}`;

const URL = (process.env.FOUNDRY_URL || "http://localhost:30000").replace(/\/$/, "");

declare const game: any;
declare const foundry: any;
declare const Actor: any;

/** Join the running world as a named passwordless user and wait for game.ready. */
export async function joinAsUser(page: Page, label: string): Promise<void> {
  await page.goto(`${URL}/join`, { waitUntil: "domcontentloaded" });
  const userSelect = page.locator('select[name="userid"]');
  await userSelect.waitFor({ timeout: 30_000 });
  // Options for already-connected users are disabled client-side only; re-enable first.
  await page.evaluate(() => {
    for (const o of document.querySelectorAll('select[name="userid"] option'))
      (o as HTMLOptionElement).disabled = false;
  });
  await userSelect.selectOption({ label });
  await page.click('button[name="join"]');
  await page.waitForFunction(() => (globalThis as any).game?.ready === true, null, {
    timeout: 120_000,
  });
}

/** Join as the world fixture's built-in Gamemaster (global-setup only; specs use their slot's GM). */
export async function joinAsGM(page: Page): Promise<void> {
  await joinAsUser(page, "Gamemaster");
}

/**
 * Open `actorName`'s sheet and return its root locator. The OSC sheet registers under
 * `ose.OscSheet` with makeDefault, and the actor fixture pins the actor's
 * core.sheetClass flag, so render() shows the OSC sheet.
 */
export async function openCharacterSheet(page: Page, actorName: string): Promise<Locator> {
  const appId = await page.evaluate(async (name) => {
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

    // The actor is created in the GM session; an observer session learns about it
    // over the socket, so wait rather than throwing on the first miss.
    let actor = g.game.actors.getName(name);
    for (let i = 0; i < 100 && !actor; i++) {
      await new Promise((r) => setTimeout(r, 100));
      actor = g.game.actors.getName(name);
    }
    if (!actor) throw new Error(`Actor "${name}" not found`);
    if (!actor.sheet.rendered) await actor.sheet.render(true);
    // First render races: the render() promise can resolve before the element is
    // attached, and setPosition() calls getComputedStyle() on it. Wait for it.
    for (let i = 0; i < 60 && !(actor.sheet.element instanceof HTMLElement); i++)
      await new Promise((r) => setTimeout(r, 50));
    // Force the wide (large) layout tier so the horizontal tab bar renders.
    actor.sheet.setPosition?.({ width: 920, height: 820 });
    return actor.sheet.element?.id as string;
  }, actorName);
  // Address this actor's window by id: a page may briefly hold another sheet.
  const sheet = appId ? page.locator(`[id="${appId}"]`) : page.locator(".osc-sheet").first();
  await sheet.waitFor({ state: "visible", timeout: 30_000 });
  return sheet;
}

export type Box = { x: number; y: number; width: number; height: number };

/**
 * Client rects for every element the locator matches, read in ONE page
 * evaluation so the set is a consistent snapshot rather than N independently
 * timed `boundingBox()` calls. Zero-area (collapsed / hidden) elements are kept
 * — a caller asserting layout wants to see them.
 */
export async function boxesOf(locator: Locator): Promise<Box[]> {
  return locator.evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    }),
  );
}

/**
 * How many visual rows a set of boxes occupies. Two boxes share a row when their
 * vertical spans overlap by at least half the shorter one, which tolerates the
 * few px of height variation real grid cells have without merging genuine rows.
 *
 * This is the shape of assertion that catches a layout collapse: six ability
 * plaques rendering one-per-row are all still perfectly visible, but they go
 * from 1 row to 6.
 */
export function rowsOf(boxes: Box[]): number {
  const sorted = [...boxes].sort((a, b) => a.y - b.y);
  let rows = 0;
  let anchor: Box | null = null;
  for (const b of sorted) {
    if (anchor) {
      const overlap = Math.min(anchor.y + anchor.height, b.y + b.height) - Math.max(anchor.y, b.y);
      if (overlap >= 0.5 * Math.min(anchor.height, b.height)) continue;
    }
    rows++;
    anchor = b;
  }
  return rows;
}

/** Close any roll dialogs a spec left behind, leaving Foundry's core UI alone. */
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

/** Read a value off an actor by dot-path (e.g. "system.scores.str.value"). */
export async function actorGet(page: Page, actorName: string, path: string): Promise<unknown> {
  return page.evaluate(
    ({ name, p }) => {
      const actor = (globalThis as any).game.actors.getName(name);
      return (globalThis as any).foundry.utils.getProperty(actor, p);
    },
    { name: actorName, p: path },
  );
}

/** Embedded item id on an actor, by item name. */
export async function itemId(page: Page, actorName: string, name: string): Promise<string> {
  const id = await page.evaluate(
    ({ actor, item }) => {
      const a = (globalThis as any).game.actors.getName(actor);
      return a?.items.getName(item)?.id ?? null;
    },
    { actor: actorName, item: name },
  );
  if (!id) throw new Error(`Item "${name}" not found on ${actorName}`);
  return id as string;
}

/** Read a value off an embedded item by name + dot-path. */
export async function itemGet(
  page: Page,
  actorName: string,
  name: string,
  path: string,
): Promise<unknown> {
  return page.evaluate(
    ({ actor, item, p }) => {
      const a = (globalThis as any).game.actors.getName(actor);
      const it = a?.items.getName(item);
      return (globalThis as any).foundry.utils.getProperty(it, p);
    },
    { actor: actorName, item: name, p: path },
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
