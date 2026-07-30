import { test, expect } from "../fixtures";
import { openCharacterSheet } from "../helpers";

test.describe("tab navigation", () => {
  test("switching tabs updates the selected tab and panel", async ({ gamePage, fighter }) => {
    const sheet = await openCharacterSheet(gamePage, fighter.name);

    const inventoryTab = sheet.locator('[data-testid="tab-inventory"]');
    await inventoryTab.click();
    await expect(inventoryTab).toHaveAttribute("aria-selected", "true");
    // Inventory body renders the Wealth toggle.
    await expect(sheet.locator('[data-testid="wealth-toggle"]')).toBeVisible();

    const abilitiesTab = sheet.locator('[data-testid="tab-abilities"]');
    await abilitiesTab.click();
    await expect(abilitiesTab).toHaveAttribute("aria-selected", "true");
    await expect(inventoryTab).toHaveAttribute("aria-selected", "false");

    const actionsTab = sheet.locator('[data-testid="tab-actions"]');
    await actionsTab.click();
    await expect(actionsTab).toHaveAttribute("aria-selected", "true");
  });
});
