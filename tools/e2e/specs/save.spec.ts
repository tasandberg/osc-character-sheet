import { test, expect } from "../fixtures";
import { openCharacterSheet, chatCount, confirmRollDialogIfPresent } from "../helpers";

test.describe("saving throws", () => {
  test("rolling a death save posts a chat message", async ({ gamePage, fighter }) => {
    const sheet = await openCharacterSheet(gamePage, fighter.name);

    const before = await chatCount(gamePage);
    await sheet.locator('[data-testid="save-death"]:visible').first().click();
    await confirmRollDialogIfPresent(gamePage);

    await expect.poll(() => chatCount(gamePage), { timeout: 15_000 }).toBeGreaterThan(before);
  });
});
