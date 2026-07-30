import { test, expect } from "../fixtures";
import { openCharacterSheet, chatCount, confirmRollDialogIfPresent, itemId } from "../helpers";

test.describe("weapon attacks", () => {
  test("toggling attack mode and rolling to hit posts a chat message", async ({ gamePage, fighter }) => {
    const sheet = await openCharacterSheet(gamePage, fighter.name);
    await sheet.locator('[data-testid="tab-actions"]').click();

    const dagger = await itemId(gamePage, fighter.name, fighter.weapon);

    // Dagger is melee+missile → a segmented mode toggle. Switch to missile.
    const missile = sheet.locator(`[data-testid="attack-mode-missile-${dagger}"]`);
    if (await missile.isVisible().catch(() => false)) {
      await missile.click();
      await expect(missile).toHaveAttribute("aria-pressed", "true");
    }

    const before = await chatCount(gamePage);
    await sheet.locator(`[data-testid="weapon-hit-${dagger}"]`).click();
    await confirmRollDialogIfPresent(gamePage);

    await expect.poll(() => chatCount(gamePage), { timeout: 15_000 }).toBeGreaterThan(before);
  });
});
