import { test, expect } from "../fixtures";
import { openCharacterSheet, closeDialogs } from "../helpers";

/**
 * Read-only sheet for non-owners (OLD-41). Logs in as the seeded OBSERVER player
 * (view-only permission on the fixture actor — see global-setup) and asserts the
 * whole sheet — every tab, including inventory — exposes no way to mutate the
 * character: no HP steppers, no editable portrait, no Edit modal, no per-tab edit
 * controls, no writing Attack roll, and (inventory) no drag, no equip toggle, no
 * coin edit, no mutating context-menu items. The sheet must stay fully readable.
 *
 * Chat-only rolls (ability/save/exploration/hit/dmg — post a card, no actor write)
 * intentionally stay available; only affordances that WRITE the actor are gated.
 */

// Fighter (non-caster) tabs minus inventory; spells is hidden (not a caster).
const NON_INVENTORY_TABS = ["actions", "abilities", "notes"] as const;

// Await the tab body's stable anchor before running negative (toHaveCount(0))
// assertions, so they can't pass vacuously by racing the async tab-body render.
const TAB_ANCHOR: Record<(typeof NON_INVENTORY_TABS)[number], string> = {
  actions: ".osc-atk",
  abilities: ".osc-abilities-tab",
  notes: ".osc-notes-tab",
};

test.describe("read-only sheet (non-owner)", () => {
  // observerPage is worker-scoped + shared, so tidy up anything this spec opened
  // (context menu, dialogs) and capture the observer sheet on failure — the global
  // afterEach only covers gamePage.
  test.afterEach(async ({ observerPage }, testInfo) => {
    await observerPage.keyboard.press("Escape").catch(() => {});
    if (testInfo.status !== testInfo.expectedStatus) {
      await observerPage
        .screenshot({ path: testInfo.outputPath("observer-failure.png"), fullPage: true })
        .then((buf) => testInfo.attach("observer-failure", { body: buf, contentType: "image/png" }))
        .catch(() => {});
    }
    await closeDialogs(observerPage);
  });

  test("observer sees a view-only sheet with no edit affordances", async ({
    observerPage,
  }) => {
    const sheet = await openCharacterSheet(observerPage);
    await expect(sheet).toBeVisible();

    // Root affordance suppression marker is present (owner sheets omit it).
    await expect(observerPage.locator(".osc-sheet-app.is-readonly")).toHaveCount(1);

    // --- Persistent header + topbar: no character-edit affordances ---
    // HP steppers / editable HP input (owner-only; static value stays).
    await expect(sheet.locator(".vv-step")).toHaveCount(0);
    await expect(sheet.locator("input.vv-input")).toHaveCount(0);
    await expect(sheet.locator(".osc-mb-hp-btn")).toHaveCount(0);
    await expect(sheet.locator("input.osc-mb-hp-input")).toHaveCount(0);
    // Portrait click-to-edit action is not wired for non-owners.
    await expect(sheet.locator('img[data-action="editImage"]')).toHaveCount(0);
    // Topbar character actions (Rest / Level Up / Edit + overflow) are gone;
    // the theme toggle (.osc-tb-btn.icon) stays for everyone.
    await expect(sheet.locator(".osc-tb-actions .osc-tb-btn")).toHaveCount(0);
    await expect(sheet.locator(".osc-tb-menu-wrap")).toHaveCount(0);

    // Sheet is still readable: HP value + AC render.
    await expect(sheet.locator(".vv-value").first()).toBeVisible();
    await expect(sheet.locator('[data-testid="ac-value"]')).toBeVisible();

    // --- Each non-inventory tab: readable, no edit controls ---
    for (const id of NON_INVENTORY_TABS) {
      const tab = sheet.locator(`[data-testid="tab-${id}"]`);
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      // Wait for the tab body to actually render before the negative assertions.
      await expect(sheet.locator(TAB_ANCHOR[id])).toBeVisible();

      if (id === "actions") {
        // The equipped Dagger renders a weapon row with its Attack button — but for
        // a non-owner the writing Attack affordance is present-yet-disabled (inert),
        // not hidden.
        await expect(sheet.locator('[data-testid^="weapon-row-"]').first()).toBeVisible();
        await expect(sheet.locator('[data-testid^="weapon-attack-"]').first()).toBeDisabled();
      }
      if (id === "abilities") {
        await expect(sheet.locator('[aria-label="Add ability"]')).toHaveCount(0);
        await expect(sheet.locator('[aria-label="Edit languages"]')).toHaveCount(0);
      }
      if (id === "notes") {
        await expect(sheet.locator(".osc-rt-edit")).toHaveCount(0);
      }
    }

    // --- Inventory tab: fully view-only ---
    const inventoryTab = sheet.locator('[data-testid="tab-inventory"]');
    await inventoryTab.click();
    await expect(inventoryTab).toHaveAttribute("aria-selected", "true");

    // Wait for a REAL item row (not the sticky sort-header) before negatives.
    const itemRow = sheet.locator(".osc-inv-row:not(.osc-inv-headrow)").first();
    await expect(itemRow).toBeVisible();
    await expect(sheet.locator('[data-testid="wealth-toggle"]')).toBeVisible();

    // No equip toggle buttons (owner-only; observers get a static indicator).
    await expect(sheet.locator('[data-testid^="equip-"]')).toHaveCount(0);
    // No draggable rows / tray tiles / coin grips (drag disabled for non-owners).
    await expect(sheet.locator('.osc-inv-row[draggable="true"]')).toHaveCount(0);
    await expect(sheet.locator('.osc-equip-tcard[draggable="true"]')).toHaveCount(0);
    await expect(sheet.locator('.osc-inv-drag[draggable="true"]')).toHaveCount(0);

    // Coin quantity is view-only (open the wealth table first).
    await sheet.locator('[data-testid="wealth-toggle"]').click();
    const coinQty = sheet.locator('[data-testid="coin-qty-gp"]');
    await expect(coinQty).toBeVisible();
    await expect(coinQty).toBeDisabled();

    // Item context menu is view-only: only "View Item", no Send/Unequip/Consume/Delete.
    await itemRow.click({ button: "right" });
    const menu = sheet.locator(".osc-ctx");
    await expect(menu).toBeVisible();
    await expect(menu.locator(".osc-ctx-item")).toHaveCount(1);
    await expect(menu.locator(".osc-ctx-item")).toHaveText(/View Item/);
    await expect(menu.locator(".osc-ctx-item.is-danger")).toHaveCount(0);
  });

  // Control: the OWNER (GM) sheet renders the very affordances the observer lacks,
  // so the observer's toHaveCount(0) checks above aren't passing vacuously.
  test("owner sheet exposes the affordances the observer is denied", async ({
    gamePage,
  }) => {
    const sheet = await openCharacterSheet(gamePage);
    // Owner sheet is editable → no read-only marker.
    await expect(sheet.locator(".osc-sheet-app.is-readonly")).toHaveCount(0);

    // Owner keeps HP steppers + the Edit action.
    await expect(sheet.locator(".vv-step").first()).toBeVisible();
    await expect(sheet.locator(".osc-tb-actions .osc-tb-btn")).not.toHaveCount(0);

    // Actions tab: the writing Attack button is present for the owner.
    await sheet.locator('[data-testid="tab-actions"]').click();
    await expect(sheet.locator('[data-testid^="weapon-attack-"]').first()).toBeVisible();

    // Inventory tab: equip toggle buttons + draggable rows are present for the owner.
    await sheet.locator('[data-testid="tab-inventory"]').click();
    await expect(sheet.locator('.osc-inv-row:not(.osc-inv-headrow)').first()).toBeVisible();
    await expect(sheet.locator('[data-testid^="equip-"]').first()).toBeVisible();
    await expect(sheet.locator('.osc-inv-row[draggable="true"]')).not.toHaveCount(0);
  });
});
