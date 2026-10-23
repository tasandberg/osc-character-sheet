import { test, expect } from "../fixtures";
import { openCharacterSheet } from "../helpers";

test.describe("user guide", () => {
  test("opens from the sheet header and searches", async ({ gamePage, fighter }) => {
    const sheet = await openCharacterSheet(gamePage, fighter.name);
    await sheet.getByRole("button", { name: "Open user guide" }).click();

    const guide = gamePage.getByRole("dialog", { name: "Character sheet guide" });
    const search = guide.getByRole("combobox", { name: "Search the guide" });
    await expect(search).toBeFocused();

    await search.fill("encumbrance");
    await expect(guide.getByRole("option").first()).toContainText("Encumbrance");
    await search.press("Enter");
    await expect(guide.getByRole("heading", { name: "Encumbrance" })).toBeFocused();

    await gamePage.keyboard.press("Escape");
    await expect(guide).toHaveCount(0);
  });

  test("a contextual link lands on its section", async ({ gamePage, fighter }) => {
    const sheet = await openCharacterSheet(gamePage, fighter.name);
    await sheet.locator('[data-testid="tab-inventory"]').click();
    await sheet.getByRole("button", { name: "Guide: Encumbrance" }).click();

    const guide = gamePage.getByRole("dialog", { name: "Character sheet guide" });
    await expect(guide.getByRole("heading", { name: "Encumbrance" })).toBeFocused();
    await guide.locator('[data-action="close"]').click();
  });
});
