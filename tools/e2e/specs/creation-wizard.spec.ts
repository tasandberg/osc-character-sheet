import type { Locator, Page } from "@playwright/test";
import { test, expect } from "../fixtures";
import { openCharacterSheet } from "../helpers";

const MODULE_ID = "osc-character-sheet";
const SHEET_CLASS = "ose.OscSheet";

const wizardSupported = (page: Page) =>
  page.evaluate(() => {
    const g = globalThis as any;
    return !g.foundry.utils.isNewerVersion("3.2.0", g.game.system.version);
  });

const enableWizard = (page: Page) =>
  page.evaluate(async (mod) => {
    const g = globalThis as any;
    await g.game.settings.set(mod, "creationWizard", true);
    await g.game.settings.set(mod, "allowScoresArrange", true);
    await g.game.settings.set(mod, "allowScoresManual", true);
    g.ui.sidebar.expand();
    g.ui.actors.activate();
    await g.ui.actors.render();
  }, MODULE_ID);

test.afterEach(async ({ gamePage }) => {
  await gamePage.evaluate(async (mod) => {
    const g = globalThis as any;
    await g.game.settings.set(mod, "allowScoresArrange", false);
    await g.game.settings.set(mod, "allowScoresManual", false);
  }, MODULE_ID);
});

const createBlankCharacter = (page: Page, name: string) =>
  page.evaluate(
    async ([actorName, sheetClass]) => {
      const actor = await (globalThis as any).Actor.create({
        name: actorName,
        type: "character",
        flags: { core: { sheetClass } },
      });
      return actor.id as string;
    },
    [name, SHEET_CLASS],
  );

const nextButton = (wizard: Locator) => wizard.getByRole("button", { name: /^Next/ });

async function chooseScoresAndClass(wizard: Locator) {
  await wizard.getByRole("radio", { name: /^Enter manually/ }).check({ force: true });
  for (const [ability, value] of [
    ["Strength", "13"],
    ["Intelligence", "10"],
    ["Wisdom", "10"],
    ["Dexterity", "10"],
    ["Constitution", "10"],
    ["Charisma", "10"],
  ])
    await wizard.getByRole("textbox", { name: ability }).fill(value);
  await nextButton(wizard).click();

  await wizard.getByRole("radio", { name: "Fighter" }).check({ force: true });
  await nextButton(wizard).click();
}

async function finishDetails(wizard: Locator) {
  await wizard.getByText("Neutral", { exact: true }).click();
  await wizard.getByRole("button", { name: "Roll 1d8" }).click();
  await expect(wizard.getByRole("textbox", { name: "Hit points" })).not.toHaveValue("");
  await nextButton(wizard).click();
}

test.describe("creation wizard", () => {
  test.beforeEach(async ({ gamePage }) => {
    test.skip(!(await wizardSupported(gamePage)), "the creation wizard needs OSE 3.2.0 or later");
  });

  test("opens a themed New Character window from the Actors sidebar", async ({ gamePage }) => {
    await enableWizard(gamePage);

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
    await enableWizard(gamePage);

    try {
      await gamePage.locator("#actors").getByRole("button", { name: "New Character" }).click();
      const wizard = gamePage.locator("#osc-creation-wizard");
      await wizard.getByRole("radio", { name: /3d6 and arrange/ }).check({ force: true });
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

  test("a GM adds a custom roll method that players can roll and that persists", async ({
    gamePage,
  }) => {
    const label = "4d6 drop lowest";
    await enableWizard(gamePage);
    const openWizard = async () => {
      await gamePage.locator("#actors").getByRole("button", { name: "New Character" }).click();
      return gamePage.locator("#osc-creation-wizard");
    };

    try {
      const wizard = await openWizard();
      await wizard.getByRole("button", { name: "Roll methods" }).click();
      await wizard.getByRole("button", { name: "Add a roll method" }).click();
      await wizard.getByRole("textbox", { name: "Roll method label" }).fill(label);
      await wizard.getByRole("textbox", { name: "Roll formula" }).fill("4d6dl");
      await wizard.getByRole("button", { name: "Add", exact: true }).click();
      await expect(wizard.getByRole("checkbox", { name: new RegExp(label) })).toBeChecked();
      await wizard.getByRole("button", { name: "Close" }).last().click();

      await wizard.getByRole("radio", { name: label }).check({ force: true });
      await wizard.getByRole("button", { name: "Roll all six" }).click();

      const dice = wizard.getByRole("img", { name: /^Dice / });
      await expect(dice).toHaveCount(6);
      for (const name of await dice.evaluateAll((els) =>
        els.map((el) => el.getAttribute("aria-label")!),
      )) {
        const kept = name.replace("Dice ", "").split(", ").map(Number);
        expect(kept).toHaveLength(3);
        const total = kept.reduce((sum, die) => sum + die, 0);
        expect(total).toBeGreaterThanOrEqual(3);
        expect(total).toBeLessThanOrEqual(18);
        await expect(wizard.getByText(String(total), { exact: true }).first()).toBeVisible();
      }

      await gamePage.reload({ waitUntil: "domcontentloaded" });
      await gamePage.waitForFunction(() => (globalThis as any).game?.ready === true, null, {
        timeout: 120_000,
      });
      await enableWizard(gamePage);
      await expect((await openWizard()).getByRole("radio", { name: label })).toBeVisible();
    } finally {
      await gamePage.evaluate(
        async ([mod, methodLabel]) => {
          const g = globalThis as any;
          await g.foundry.applications.instances.get("osc-creation-wizard")?.close();
          await g.game.settings.set(
            mod,
            "customScoreMethods",
            g.game.settings.get(mod, "customScoreMethods").filter((m: any) => m.label !== methodLabel),
          );
          await g.game.settings.set(mod, "creationWizard", false);
        },
        [MODULE_ID, label],
      );
    }
  });

  test("creates the reviewed character and opens its sheet", async ({ gamePage, slot }, testInfo) => {
    const name = `E2E Wizard ${slot}-${testInfo.testId}-${testInfo.repeatEachIndex}`;
    await enableWizard(gamePage);

    try {
      await gamePage.locator("#actors").getByRole("button", { name: "New Character" }).click();
      const wizard = gamePage.locator("#osc-creation-wizard");

      await chooseScoresAndClass(wizard);
      await wizard.getByRole("textbox", { name: "Name" }).fill(name);
      await finishDetails(wizard);

      await wizard.getByRole("button", { name: "Roll starting gold" }).click();
      const add = wizard.getByRole("button", { name: /^Add / }).first();
      const bought = (await add.getAttribute("aria-label"))!.replace(/^Add /, "");
      await add.click();
      const pack = wizard.getByRole("complementary", { name: "Pack" });
      await expect(pack.getByText("1 item", { exact: true })).toBeVisible();
      const goldLeft = (await pack.getByRole("definition").innerText()).match(/\d+/)![0];
      await nextButton(wizard).click();
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
          items: a.items.map((item: any) => item.name),
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
      expect(actor.items).toContain(bought);

      const sheet = await openCharacterSheet(gamePage, name);
      await sheet.locator('[data-testid="tab-inventory"]').click();
      await sheet.locator('[data-testid="wealth-toggle"]').click();
      await expect(sheet.locator('[data-testid="coin-qty-gp"]')).toHaveValue(goldLeft);
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

  test("the blank-sheet banner fills the same actor", async ({ gamePage, slot }, testInfo) => {
    const name = `E2E Blank ${slot}-${testInfo.testId}-${testInfo.repeatEachIndex}`;
    await enableWizard(gamePage);
    const id = await createBlankCharacter(gamePage, name);

    try {
      const sheet = await openCharacterSheet(gamePage, name);
      await expect(sheet.getByText("This character is blank.")).toBeVisible();
      await sheet.getByRole("button", { name: "Create character" }).click();

      const wizard = gamePage.locator(`[id="osc-creation-wizard-${id}"]`);
      await chooseScoresAndClass(wizard);
      await expect(wizard.getByRole("textbox", { name: "Name" })).toHaveValue(name);
      await finishDetails(wizard);
      await wizard.getByRole("button", { name: "Roll starting gold" }).click();
      await nextButton(wizard).click();
      await wizard.getByRole("button", { name: "Create Character" }).click();
      await expect(wizard).toBeHidden();

      const result = await gamePage.evaluate(
        ([actorId, actorName]) => {
          const g = globalThis as any;
          const a = g.game.actors.get(actorId);
          return {
            className: a.system.details.class,
            strength: a.system.scores.str.value,
            actorsWithName: g.game.actors.filter((actor: any) => actor.name === actorName).length,
          };
        },
        [id, name],
      );
      expect(result).toEqual({ className: "Fighter", strength: 13, actorsWithName: 1 });
    } finally {
      await gamePage.evaluate(
        async ([mod, actorId, actorName]) => {
          const g = globalThis as any;
          await g.foundry.applications.instances.get(`osc-creation-wizard-${actorId}`)?.close();
          await g.game.settings.set(mod, "creationWizard", false);
          for (const actor of g.game.actors.filter((a: any) => a.name === actorName))
            await actor.delete();
        },
        [MODULE_ID, id, name],
      );
    }
  });
});

test.describe("creation wizard below OSE 3.2.0", () => {
  test("offers no New Character button and no blank-sheet banner", async ({
    gamePage,
    slot,
  }, testInfo) => {
    test.skip(await wizardSupported(gamePage), "only applies to OSE older than 3.2.0");
    const name = `E2E Blank ${slot}-${testInfo.testId}-${testInfo.repeatEachIndex}`;
    await enableWizard(gamePage);
    await createBlankCharacter(gamePage, name);

    try {
      const actors = gamePage.locator("#actors");
      await expect(actors).toBeVisible();
      await expect(actors.getByRole("button", { name: "New Character" })).toHaveCount(0);

      const sheet = await openCharacterSheet(gamePage, name);
      await expect(sheet.locator('[data-testid="tab-actions"]')).toBeVisible();
      await expect(sheet.getByText("This character is blank.")).toHaveCount(0);
    } finally {
      await gamePage.evaluate(
        async ([mod, actorName]) => {
          const g = globalThis as any;
          await g.game.settings.set(mod, "creationWizard", false);
          await g.game.actors.getName(actorName)?.delete();
        },
        [MODULE_ID, name],
      );
    }
  });
});
