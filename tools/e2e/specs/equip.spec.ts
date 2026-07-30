import { test, expect } from "../fixtures";
import { openCharacterSheet, itemId, itemGet } from "../helpers";

test.describe("equip / unequip", () => {
  test("toggling equip flips the item's equipped state", async ({ gamePage, fighter }) => {
    const sheet = await openCharacterSheet(gamePage, fighter.name);
    await sheet.locator('[data-testid="tab-inventory"]').click();

    // Use the armor so this test stays independent of the weapon the attack
    // test needs kept equipped.
    const armor = await itemId(gamePage, fighter.name, fighter.armor);
    const equip = sheet.locator(`[data-testid="equip-${armor}"]`);
    await expect(equip).toBeVisible();

    const wasEquipped = await itemGet(gamePage, fighter.name, fighter.armor, "system.equipped");
    await equip.click();

    await expect
      .poll(() => itemGet(gamePage, fighter.name, fighter.armor, "system.equipped"), {
        timeout: 15_000,
      })
      .toBe(!wasEquipped);
    await expect(equip).toHaveAttribute("aria-pressed", String(!wasEquipped));
  });
});
