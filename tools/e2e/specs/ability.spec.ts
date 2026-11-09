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

test.describe("ability score breakdown", () => {
  test("lists an effect on the score and saves an edited base score", async ({ gamePage, fighter }) => {
    const base = await gamePage.evaluate(async (name) => {
      const game = (globalThis as any).game;
      const actor = game.actors.getName(name);
      const change =
        game.release.generation >= 14
          ? { system: { changes: [{ key: "system.scores.con.value", type: "add", value: 1 }] } }
          : { changes: [{ key: "system.scores.con.value", mode: 2, value: "1" }] };
      await actor.createEmbeddedDocuments("ActiveEffect", [{ name: "E2E Toughness", img: "icons/svg/aura.svg", ...change }]);
      return actor._source.system.scores.con.value as number;
    }, fighter.name);

    const sheet = await openCharacterSheet(gamePage, fighter.name);
    await sheet.locator('[data-testid="tab-actions"]').click();
    await sheet.getByRole("button", { name: "Constitution breakdown" }).click();

    const adjustment = sheet.getByRole("list", { name: "Adjustments" }).getByRole("listitem");
    await expect(adjustment.filter({ hasText: "E2E Toughness" })).toContainText("+1", { timeout: 15_000 });

    const next = base === 10 ? 11 : 10;
    const baseScore = sheet.getByRole("spinbutton", { name: "Base score" });
    await baseScore.fill(String(next));
    await baseScore.press("Enter");

    await expect
      .poll(() =>
        gamePage.evaluate((name) => (globalThis as any).game.actors.getName(name)._source.system.scores.con.value, fighter.name),
      )
      .toBe(next);
  });
});
