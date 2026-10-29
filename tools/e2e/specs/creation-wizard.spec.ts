import { test, expect } from "../fixtures";

const MODULE_ID = "osc-character-sheet";

test.describe("creation wizard", () => {
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
      const chip = rolls.getByRole("button", { name: /rolled/ }).first();
      await expect(chip).toBeVisible();
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
});
