import { test, expect } from "../fixtures";
import { openCharacterSheet, itemGet } from "../helpers";
import type { Locator } from "@playwright/test";

const SAVES_AT_LEVEL_3: Record<string, number> = {
  "Death / Poison": 9,
  "Magic Wands": 10,
  "Paralysis / Petrify": 12,
  "Breath Attacks": 14,
  "Spells / Rods / Staves": 13,
};

const fieldOf = (scope: Locator, label: string) =>
  scope.getByText(label, { exact: true }).locator("xpath=..");

test.describe("character with an OSE class item", () => {
  test("the Identity section levels the class item and class-derived values are read-only", async ({
    gamePage,
    slot,
  }, testInfo) => {
    const hasClassItems = await gamePage.evaluate(
      () => "class" in ((globalThis as any).CONFIG.Item.dataModels ?? {}),
    );
    test.skip(!hasClassItems, "this OSE version has no class items");

    const tag = `${slot}-${testInfo.testId}-${testInfo.repeatEachIndex}`;
    const name = `E2E Cleric ${tag}`;
    const className = `Cleric ${tag}`;

    const ascending = await gamePage.evaluate(async ({ actorName, cls }) => {
      const g = globalThis as any;
      const row = (
        xp: number,
        hd: string,
        thac0: number,
        saves: number[],
        spellSlots: Record<string, number>,
      ) => {
        const [death, wand, paralysis, breath, spell] = saves;
        return {
          xp,
          hd,
          thac0,
          bba: 19 - thac0,
          saves: { death, wand, paralysis, breath, spell },
          spellSlots,
        };
      };
      await g.Actor.create({
        name: actorName,
        type: "character",
        flags: { core: { sheetClass: "ose.OscSheet" } },
        items: [
          {
            name: cls,
            type: "class",
            system: {
              hitDie: "1d6",
              maxLevel: 3,
              level: 1,
              levels: [
                row(0, "1d6", 19, [11, 12, 14, 16, 15], {}),
                row(1500, "2d6", 19, [11, 12, 14, 16, 15], { "1": 1 }),
                row(3000, "3d6", 17, [9, 10, 12, 14, 13], { "1": 2 }),
              ],
            },
          },
        ],
      });
      return !!g.game.settings.get(g.game.system.id, "ascendingAC");
    }, { actorName: name, cls: className });

    try {
      const sheet = await openCharacterSheet(gamePage, name);
      await sheet.locator('[data-testid="tab-abilities"]').click();

      const level = sheet.getByLabel(`${className} level`, { exact: true });
      await expect(level).toHaveValue("1");
      await level.fill("3");
      await level.press("Enter");

      await expect
        .poll(() => itemGet(gamePage, name, className, "system.level"), { timeout: 15_000 })
        .toBe(3);
      await expect(level).toHaveValue("3");

      await sheet
        .locator('[data-testid="topbar-actions"]')
        .getByRole("button", { name: "Edit", exact: true })
        .click();

      const attack = fieldOf(sheet, ascending ? "Attack Bonus" : "THAC0");
      await expect(attack.getByRole("spinbutton")).toHaveValue(ascending ? "2" : "17");
      await expect(attack.getByRole("spinbutton")).toBeDisabled();
      await expect(attack.getByText("from class")).toBeVisible();

      const hitDice = fieldOf(sheet, "Hit Dice");
      await expect(hitDice.getByRole("textbox")).toHaveValue("3d6");
      await expect(hitDice.getByRole("textbox")).toBeDisabled();
      await expect(hitDice.getByText("from class")).toBeVisible();

      for (const [save, target] of Object.entries(SAVES_AT_LEVEL_3)) {
        const cell = sheet.getByLabel(save, { exact: true }).locator("xpath=..");
        await expect(cell.getByRole("spinbutton")).toHaveValue(String(target));
        await expect(cell.getByRole("spinbutton")).toBeDisabled();
        await expect(cell.getByText("from class")).toBeVisible();
      }

      await sheet.getByRole("button", { name: "Close", exact: true }).first().click();
      await sheet.locator('[data-testid="tab-spells"]').click();
      await expect(sheet.getByText("0 / 2", { exact: true })).toBeVisible();
    } finally {
      await gamePage.evaluate(async (actorName) => {
        await (globalThis as any).game.actors.getName(actorName)?.delete();
      }, name);
    }
  });
});
