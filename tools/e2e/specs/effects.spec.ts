import { test, expect } from "../fixtures";
import { openCharacterSheet } from "../helpers";

test.describe("effects modal", () => {
  test("lists the actor's effects and moves a disabled one to Inactive", async ({ gamePage, fighter }) => {
    await gamePage.evaluate(async (name) => {
      const actor = (globalThis as any).game.actors.getName(name);
      await actor.createEmbeddedDocuments("ActiveEffect", [{ name: "E2E Shield", img: "icons/svg/aura.svg" }]);
    }, fighter.name);

    const sheet = await openCharacterSheet(gamePage, fighter.name);
    await sheet.getByRole("button", { name: "Effects", exact: true }).click();

    const passive = sheet.getByRole("region", { name: "Passive Effects" });
    const inactive = sheet.getByRole("region", { name: "Inactive Effects" });
    await expect(passive.getByRole("listitem").filter({ hasText: "E2E Shield" })).toBeVisible();

    await passive.getByRole("button", { name: "Disable effect" }).click();

    await expect(inactive.getByRole("listitem").filter({ hasText: "E2E Shield" })).toBeVisible({ timeout: 15_000 });
    await expect(passive.getByRole("listitem").filter({ hasText: "E2E Shield" })).toHaveCount(0);
  });
});
