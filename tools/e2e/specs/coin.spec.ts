import { test, expect } from "../fixtures";
import { openCharacterSheet, itemGet } from "../helpers";

test.describe("wealth / coins", () => {
  test("editing a coin quantity persists to the coin item", async ({ gamePage, fighter }) => {
    const sheet = await openCharacterSheet(gamePage, fighter.name);
    await sheet.locator('[data-testid="tab-inventory"]').click();

    await sheet.locator('[data-testid="wealth-toggle"]').click();
    const gp = sheet.locator('[data-testid="coin-qty-gp"]');
    await expect(gp).toBeVisible();

    await gp.fill("123");
    await gp.blur();

    await expect
      .poll(() => itemGet(gamePage, fighter.name, fighter.coin, "system.quantity.value"), { timeout: 15_000 })
      .toBe(123);
  });
});
