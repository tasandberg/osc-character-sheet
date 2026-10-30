import { test, expect } from "../fixtures";

const MODULE_ID = "osc-character-sheet";

test.describe("creation wizard", () => {
  test.beforeEach(async ({ gamePage }) => {
    const supported = await gamePage.evaluate(() => {
      const g = globalThis as any;
      return !g.foundry.utils.isNewerVersion("3.1.0", g.game.system.version);
    });
    test.skip(!supported, "the creation wizard needs OSE 3.1.0 or later");
  });

  test("opens a themed New Character window from the Actors sidebar", async ({ gamePage }) => {
    await gamePage.evaluate(async (mod) => {
      const g = globalThis as any;
      await g.game.settings.set(mod, "creationWizard", true);
      g.ui.sidebar.expand();
      g.ui.actors.activate();
      await g.ui.actors.render();
    }, MODULE_ID);

    try {
      await gamePage.locator("#actors").getByRole("button", { name: "New Character" }).click();

      const wizard = gamePage.locator("#osc-creation-wizard");
      await expect(wizard).toBeVisible();
      await expect(
        wizard.getByRole("banner").getByRole("heading", { name: "New Character" }),
      ).toBeVisible();

      const style = await wizard.evaluate((el) => ({
        width: el.getBoundingClientRect().width,
        titleFont: getComputedStyle(el.querySelector(".window-title")!).fontFamily,
        bodyBackground: getComputedStyle(el.querySelector(".osc-sheet-app")!).backgroundColor,
      }));
      expect(style.width).toBe(960);
      expect(style.titleFont).toMatch(/Fell/);
      expect(style.bodyBackground).not.toBe("rgba(0, 0, 0, 0)");
    } finally {
      await gamePage.evaluate(async (mod) => {
        const g = globalThis as any;
        await g.foundry.applications.instances.get("osc-creation-wizard")?.close();
        await g.game.settings.set(mod, "creationWizard", false);
      }, MODULE_ID);
    }
  });

  test("drags a roll onto an ability and announces the placement", async ({ gamePage }) => {
    await gamePage.evaluate(async (mod) => {
      const g = globalThis as any;
      await g.game.settings.set(mod, "creationWizard", true);
      g.ui.sidebar.expand();
      g.ui.actors.activate();
      await g.ui.actors.render();
    }, MODULE_ID);

    try {
      await gamePage.locator("#actors").getByRole("button", { name: "New Character" }).click();
      const wizard = gamePage.locator("#osc-creation-wizard");
      await wizard.getByRole("radio", { name: /Roll and arrange/ }).click();
      await wizard.getByRole("button", { name: "Roll six totals" }).click();

      const rolls = wizard.getByRole("group", { name: "Rolls" });
      await expect(rolls.getByRole("button", { name: /rolled/ })).toHaveCount(6);
      const chip = rolls.getByRole("button", { name: /rolled/ }).first();
      const total = (await chip.getAttribute("aria-label"))!.split(",")[0];
      const dex = wizard.locator(".vm-score-face", { has: gamePage.locator('[aria-label="DEX empty"]') });

      await chip.dragTo(dex);

      await expect(wizard.getByRole("button", { name: `DEX ${total}` })).toBeVisible();
      await expect(wizard.locator("[aria-live]")).toHaveText(`Placed ${total} on DEX.`);
      await expect(wizard.getByText("5 to place")).toBeVisible();
    } finally {
      await gamePage.evaluate(async (mod) => {
        const g = globalThis as any;
        await g.foundry.applications.instances.get("osc-creation-wizard")?.close();
        await g.game.settings.set(mod, "creationWizard", false);
      }, MODULE_ID);
    }
  });

  test("creates the reviewed character and opens its sheet", async ({ gamePage, slot }, testInfo) => {
    const name = `E2E Wizard ${slot}-${testInfo.testId}-${testInfo.repeatEachIndex}`;
    await gamePage.evaluate(async (mod) => {
      const g = globalThis as any;
      await g.game.settings.set(mod, "creationWizard", true);
      g.ui.sidebar.expand();
      g.ui.actors.activate();
      await g.ui.actors.render();
    }, MODULE_ID);

    try {
      await gamePage.locator("#actors").getByRole("button", { name: "New Character" }).click();
      const wizard = gamePage.locator("#osc-creation-wizard");
      const next = wizard.getByRole("button", { name: /^Next/ });

      await wizard.getByRole("radio", { name: /^Enter manually/ }).click();
      for (const [ability, value] of [
        ["Strength", "13"],
        ["Intelligence", "10"],
        ["Wisdom", "10"],
        ["Dexterity", "10"],
        ["Constitution", "10"],
        ["Charisma", "10"],
      ])
        await wizard.getByRole("textbox", { name: ability }).fill(value);
      await next.click();

      await wizard.getByRole("radio", { name: "Fighter" }).check({ force: true });
      await next.click();

      await wizard.getByRole("textbox", { name: "Name" }).fill(name);
      await wizard.getByText("Neutral", { exact: true }).click();
      await wizard.getByRole("button", { name: "Roll 1d8" }).click();
      await expect(wizard.getByRole("textbox", { name: "Hit points" })).not.toHaveValue("");
      await next.click();

      await wizard.getByRole("button", { name: "Roll starting gold" }).click();
      await next.click();
      await wizard.getByRole("button", { name: "Create Character" }).click();

      await expect(wizard).toBeHidden();
      await expect
        .poll(() =>
          gamePage.evaluate((actorName) => {
            const a = (globalThis as any).game.actors.getName(actorName);
            return a?.sheet?.rendered ?? false;
          }, name),
        )
        .toBe(true);

      const actor = await gamePage.evaluate((actorName) => {
        const a = (globalThis as any).game.actors.getName(actorName);
        return {
          sheetTitle: a.sheet.element.querySelector(".window-title")?.textContent,
          className: a.system.details.class,
          level: a.system.details.level,
          alignment: a.system.details.alignment,
          strength: a.system.scores.str.value,
          deathSave: a.system.saves.death.value,
          hitPoints: a.system.hp.max,
        };
      }, name);
      expect(actor).toMatchObject({
        className: "Fighter",
        level: 1,
        alignment: "Neutral",
        strength: 13,
        deathSave: 12,
      });
      expect(actor.hitPoints).toBeGreaterThan(0);
      expect(actor.sheetTitle).toContain(name);
    } finally {
      await gamePage.evaluate(
        async ([mod, actorName]) => {
          const g = globalThis as any;
          await g.foundry.applications.instances.get("osc-creation-wizard")?.close();
          await g.game.settings.set(mod, "creationWizard", false);
          await g.game.actors.getName(actorName)?.delete();
        },
        [MODULE_ID, name],
      );
    }
  });
});
