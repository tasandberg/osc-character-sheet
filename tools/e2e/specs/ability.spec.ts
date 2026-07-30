import { test, expect } from "../fixtures";
import { openCharacterSheet, chatCount, confirmRollDialogIfPresent } from "../helpers";

test.describe("ability checks", () => {
  test("rolling a STR check posts a chat message", async ({ gamePage, fighter }) => {
    const sheet = await openCharacterSheet(gamePage, fighter.name);
    await sheet.locator('[data-testid="tab-actions"]').click();

    const before = await chatCount(gamePage);
    await sheet.locator('[data-testid="ability-str"]:visible').first().click();
    await confirmRollDialogIfPresent(gamePage);

    await expect.poll(() => chatCount(gamePage), { timeout: 15_000 }).toBeGreaterThan(before);
  });
});
