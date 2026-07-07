import { test, expect } from "../fixtures";
import { openCharacterSheet } from "../helpers";

/**
 * Read-only sheet for non-owners (OLD-41). Logs in as the seeded OBSERVER player
 * (view-only permission on the fixture actor — see global-setup) and asserts the
 * NON-INVENTORY tabs expose no way to mutate the character: no HP steppers, no
 * editable portrait, no Edit modal, no per-tab edit controls. The sheet must stay
 * fully readable throughout.
 *
 * NOTE: the inventory tab is intentionally NOT asserted here — its read-only
 * gating (drag-reorder/nest, equip toggles, quantity steppers, coin edits) lands
 * as a follow-up after OLD-40 restructures the inventory. See the TODO below.
 */

// Fighter (non-caster) tabs minus inventory; spells is hidden (not a caster).
const NON_INVENTORY_TABS = ["actions", "abilities", "notes"] as const;

test.describe("read-only sheet (non-owner)", () => {
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

      if (id === "abilities") {
        await expect(sheet.locator('[aria-label="Add ability"]')).toHaveCount(0);
        await expect(sheet.locator('[aria-label="Delete ability"]')).toHaveCount(0);
        await expect(sheet.locator('[aria-label="Edit languages"]')).toHaveCount(0);
      }
      if (id === "notes") {
        await expect(sheet.locator(".osc-rt-edit")).toHaveCount(0);
      }
    }

    // TODO(OLD-40 follow-up): switch to the inventory tab and assert its
    // read-only gating — no drag handles, no equip toggles, no quantity/coin
    // steppers, no delete/send controls. Deferred until OLD-40 restructures the
    // inventory view (owned by that PR; do not touch its files here).
  });
});
