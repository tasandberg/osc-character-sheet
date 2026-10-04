import { test, expect } from "../fixtures";
import { actorGet, chatCount } from "../helpers";

test.describe("monster sheet", () => {
  test("edits a value inline and rolls lair number appearing", async ({ gamePage }, testInfo) => {
    const name = `E2E Monster ${testInfo.testId}`;
    const appId = await gamePage.evaluate(async (monsterName) => {
      const g = globalThis as any;
      if (!document.getElementById("__e2e_notif_css")) {
        const style = document.createElement("style");
        style.id = "__e2e_notif_css";
        style.textContent = "#notifications{pointer-events:none !important}";
        document.head.appendChild(style);
      }
      const actor = await g.Actor.create({
        name: monsterName,
        type: "monster",
        system: { details: { appearing: { d: "1d6", w: "2d10" } } },
        flags: { core: { sheetClass: "ose.OscMonsterSheet" } },
      });
      await actor.sheet.render(true);
      for (let i = 0; i < 60 && !(actor.sheet.element instanceof HTMLElement); i++)
        await new Promise((resolve) => setTimeout(resolve, 50));
      return actor.sheet.element.id as string;
    }, name);

    try {
      const sheet = gamePage.locator(`[id="${appId}"]`);
      await sheet.getByRole("button", { name: /^Edit (Armour Class|Ascending AC)$/ }).click();
      await sheet.getByRole("textbox", { name: /^(Armour Class|Ascending AC)$/ }).fill("4");
      await gamePage.keyboard.press("Enter");
      await expect
        .poll(async () => [await actorGet(gamePage, name, "system.ac.value"), await actorGet(gamePage, name, "system.aac.value")])
        .toContainEqual(4);

      const before = await chatCount(gamePage);
      await sheet.getByRole("button", { name: "Lair", exact: true }).click();
      await expect.poll(() => chatCount(gamePage), { timeout: 15_000 }).toBeGreaterThan(before);
    } finally {
      await gamePage.evaluate(async (monsterName) => {
        await (globalThis as any).game.actors.getName(monsterName)?.delete();
      }, name);
    }
  });
});
