import { test, expect } from "../fixtures";
import { openCharacterSheet } from "../helpers";

// A non-caster fighter shows four tabs; the Spells tab only appears for
// spellcasters (actor.system.spells.enabled).
const TABS = ["actions", "inventory", "abilities", "notes"] as const;

test.describe("smoke", () => {
  test("character sheet opens with its tab bar", async ({ gamePage, fighter }) => {
    const sheet = await openCharacterSheet(gamePage, fighter.name);

    await expect(sheet).toBeVisible();
    for (const id of TABS) {
      await expect(sheet.locator(`[data-testid="tab-${id}"]`)).toHaveCount(1);
    }
    // The horizontal tab bar should be the active nav at the forced wide width.
    await expect(sheet.locator('[data-testid="tab-actions"]')).toBeVisible();

    // AC shows the system value for the active ascendingAC scheme (default: descending).
    // Both-scheme observation is covered by the selectAc unit test; toggling here would
    // need a remount since the sheet doesn't re-read the setting live.
    const expectedAc = await gamePage.evaluate((name) => {
      const g = globalThis as any;
      const a = g.game.actors.getName(name);
      const asc = !!g.game.settings.get(g.game.system.id, "ascendingAC");
      return String(asc ? a.system.aac.value : a.system.ac.value);
    }, fighter.name);
    await expect(sheet.locator('[data-testid="ac-value"]')).toHaveText(expectedAc);
  });
});
