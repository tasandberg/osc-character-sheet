import { test, expect } from "../fixtures";
import { openCharacterSheet, itemId, ACTOR_NAME } from "../helpers";

declare const game: any;

/**
 * Drag-to-macro: dragging a draggable sheet element onto Foundry's macro hotbar
 * runs OSE's `hotbarDrop` hook → `createOseMacro` → a script macro that calls
 * `game.ose.rollItemMacro(name)` → `item.roll()` → the weapon-attack dialog.
 *
 * The three drag sources all write the same `buildItemMacroDragData` payload via
 * `text/plain` (inventory `useDragReorder.rowProps`, and the AttacksTable image +
 * Attack button `onDragStart`). We exercise that real component handler by firing
 * a `dragstart` on the source to capture the payload it writes, then dispatch a
 * `drop` carrying that payload onto a hotbar slot so Foundry parses it and fires
 * `hotbarDrop` — i.e. the full feature path, not a direct `rollItemMacro` call.
 *
 * Playwright's native dragTo is unreliable for Foundry's HTML5 DnD + canvas
 * hotbar, hence the deterministic event dispatch.
 */

const MACRO_NAME = "Dagger";

/**
 * In the page: fire a real `dragstart` on `sourceSel` (optionally resolved to its
 * `.osc-inv-row` ancestor) to capture the component's `text/plain` payload, then
 * dispatch dragenter/dragover/drop carrying it onto the first hotbar slot. Returns
 * the captured payload so the test can assert the component wrote item drag-data.
 */
async function dragSourceToHotbar(
  page: import("@playwright/test").Page,
  sourceSel: string,
  toRow = false,
): Promise<string> {
  return page.evaluate(
    ({ sel, row }) => {
      let src = document.querySelector(sel) as HTMLElement | null;
      if (src && row) src = src.closest(".osc-inv-row");
      if (!src) throw new Error(`drag source not found: ${sel}`);

      // 1. capture the payload the component writes in its onDragStart.
      const startDt = new DataTransfer();
      src.dispatchEvent(
        new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: startDt }),
      );
      const payload = startDt.getData("text/plain");
      src.dispatchEvent(
        new DragEvent("dragend", { bubbles: true, cancelable: true, dataTransfer: startDt }),
      );
      if (!payload) throw new Error("drag source produced no text/plain payload");

      // 2. drop it onto a hotbar slot → Foundry parses text/plain → hotbarDrop hook.
      const slot = document.querySelector("#hotbar [data-slot]") as HTMLElement | null;
      if (!slot) throw new Error("hotbar slot not found");
      const dropDt = new DataTransfer();
      dropDt.setData("text/plain", payload);
      for (const type of ["dragenter", "dragover", "drop"]) {
        slot.dispatchEvent(
          new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dropDt }),
        );
      }
      return payload;
    },
    { sel: sourceSel, row: toRow },
  );
}

test.describe("drag weapon to macro hotbar", () => {
  test.beforeAll(async ({ gamePage }) => {
    // rollItemMacro resolves the item off the speaker's actor; with no token
    // selected, give the GM an assigned character so the macro finds the Dagger.
    await gamePage.evaluate(async (name) => {
      const actor = game.actors.getName(name);
      await game.user.update({ character: actor.id });
    }, ACTOR_NAME);
  });

  test.afterAll(async ({ gamePage }) => {
    await gamePage.evaluate(() => game.user.update({ character: null })).catch(() => {});
  });

  // Keep reruns clean: drop the macro this spec created and clear hotbar slots.
  test.afterEach(async ({ gamePage }) => {
    await gamePage
      .evaluate(async (name) => {
        for (const m of [...game.macros].filter((x: any) => x.name === name)) await m.delete();
        const slots = game.user.getHotbarMacros?.() ?? [];
        for (const s of slots) if (s?.macro) await game.user.unassignHotbarMacro(s.slot);
      }, MACRO_NAME)
      .catch(() => {});
  });

  async function expectDropCreatesExecutableMacro(
    gamePage: import("@playwright/test").Page,
    sourceSel: string,
    toRow = false,
  ): Promise<void> {
    const dagger = await itemId(gamePage, "Dagger");
    const payload = await dragSourceToHotbar(gamePage, sourceSel.replace("{id}", dagger), toRow);

    // The component wrote real item drag-data (not the reorder fallback payload).
    const data = JSON.parse(payload);
    expect(data.type).toBe("Item");

    // OSE's hotbarDrop created the item macro.
    await expect
      .poll(() => gamePage.evaluate((n) => !!game.macros.getName(n), MACRO_NAME), {
        timeout: 10_000,
      })
      .toBe(true);

    // Executing it runs rollItemMacro → item.roll() → the weapon-attack dialog.
    await gamePage.evaluate((n) => game.macros.getName(n).execute(), MACRO_NAME);
    const dialog = gamePage.locator(".application.dialog").first();
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    // Close it (fixtures' afterEach also sweeps stragglers).
    const cancel = dialog.locator('button[data-action="cancel"], button[data-action="close"]').first();
    if (await cancel.isVisible().catch(() => false)) await cancel.click().catch(() => {});
    else await dialog.locator("button.header-control[data-action='close'], a.header-control").first().click().catch(() => {});
  }

  test("Attack button drops a macro that opens the weapon dialog", async ({ gamePage }) => {
    const sheet = await openCharacterSheet(gamePage);
    await sheet.locator('[data-testid="tab-actions"]').click();
    await expectDropCreatesExecutableMacro(gamePage, '[data-testid="weapon-attack-{id}"]');
  });

  test("weapon image drops a macro that opens the weapon dialog", async ({ gamePage }) => {
    const sheet = await openCharacterSheet(gamePage);
    await sheet.locator('[data-testid="tab-actions"]').click();
    await expectDropCreatesExecutableMacro(gamePage, '[data-testid="weapon-img-{id}"]');
  });

  test("inventory row drops a macro that opens the weapon dialog", async ({ gamePage }) => {
    const sheet = await openCharacterSheet(gamePage);
    await sheet.locator('[data-testid="tab-inventory"]').click();
    // The whole row is draggable; resolve from the row's equip button to its root.
    await expectDropCreatesExecutableMacro(gamePage, '[data-testid="equip-{id}"]', true);
  });
});
