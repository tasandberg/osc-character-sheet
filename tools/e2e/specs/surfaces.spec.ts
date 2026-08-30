import { test, expect } from "../fixtures";
import { openCharacterSheet, boxesOf, rowsOf, type Box } from "../helpers";

/**
 * Per-tab feature surfaces, and the layout invariants that prove they are still
 * *arranged*, not merely present.
 *
 * Why both: a stylesheet deletion once left every element rendering and every
 * gate green while ability plaques stacked one-per-row, saves stacked
 * one-per-row, the saves/exploration nav lost its tabs and a weapon card's icon
 * blew out to full width. `toBeVisible()` is blind to all of that — each element
 * was visible. So every surface here also gets a cheap geometry invariant.
 *
 * The invariants assert RELATIONSHIPS (row counts, share-of-parent widths), never
 * pixel values, so an intentional redesign — different columns, different sizes,
 * a different tier — passes, while a collapse fails. Deliberately no
 * `toHaveScreenshot`: CI renders under software WebGL and a dev machine does not,
 * so a pixel baseline would be flaky across environments.
 *
 * `openCharacterSheet` forces 920×820, which puts the sheet in the two-pane
 * large layout: horizontal tab bar, Saves/Exploration in the left rail (the
 * Actions-tab copies are hidden there via `u-foundry-lg-display-none`).
 */

/** Widest box as a fraction of the container's width. */
function widestShare(boxes: Box[], container: Box): number {
  return Math.max(...boxes.map((b) => b.width)) / container.width;
}

/** Combined box width as a fraction of the container's width. */
function filledShare(boxes: Box[], container: Box): number {
  return boxes.reduce((sum, b) => sum + b.width, 0) / container.width;
}

test.describe("tab feature surfaces", () => {
  // Walks every tab of one sheet; budget like readonly.spec.ts rather than the
  // 150s default, since the worker's Foundry boot is charged to the first test.
  test.describe.configure({ timeout: process.env.CI ? 300_000 : 120_000 });

  test("every tab renders its feature surface, laid out", async ({ gamePage, fighter }) => {
    const sheet = await openCharacterSheet(gamePage, fighter.name);

    // --- the tab bar itself ---------------------------------------------------
    // The tab bar is `tw:hidden` until the lg container query turns it into a
    // flex row, so losing that styling makes it invisible outright.
    const tabBar = sheet.locator('[data-testid="tab-bar"]');
    await expect(tabBar).toBeVisible();
    const tabButtons = tabBar.locator('[role="tab"]');
    // Fighter (non-caster): actions, inventory, abilities, notes.
    await expect(tabButtons).toHaveCount(4);
    expect(rowsOf(await boxesOf(tabButtons))).toBe(1);

    // --- Actions tab ----------------------------------------------------------
    const actionsTab = sheet.locator('[data-testid="tab-actions"]');
    await actionsTab.click();
    await expect(actionsTab).toHaveAttribute("aria-selected", "true");

    const plaques = sheet.locator('[data-testid^="ability-"]');
    await expect(plaques).toHaveCount(6);
    await expect(plaques.first()).toBeVisible();

    // 6-across at this width, 3-across narrower. Either is ≤ 2 rows; the
    // one-per-row collapse is 6.
    const plaqueBoxes = await boxesOf(plaques);
    expect(rowsOf(plaqueBoxes)).toBeLessThanOrEqual(2);
    // Same fact from the other side: a plaque is a grid cell, not a full-width
    // block. 3-up ≈ 0.32; the collapse is 1.0.
    const [abilityGrid] = await boxesOf(sheet.locator(".osc-abilities"));
    expect(widestShare(plaqueBoxes, abilityGrid)).toBeLessThan(0.6);

    // The equipped Dagger's weapon card: name, hit/damage cells, Attack button.
    const weaponRow = sheet.locator('[data-testid^="weapon-row-"]').first();
    await expect(weaponRow).toBeVisible();
    await expect(sheet.locator('[data-testid^="weapon-name-"]').first()).toBeVisible();
    await expect(sheet.locator('[data-testid^="weapon-hit-"]').first()).toBeVisible();
    await expect(sheet.locator('[data-testid^="weapon-attack-"]').first()).toBeVisible();

    // The icon is a fixed-size ink stamp. Unstyled it is a block-level <img>/<span>
    // that fills the card — the "blown-out weapon card" signature.
    const [weaponBox] = await boxesOf(weaponRow);
    const iconBoxes = await boxesOf(sheet.locator('[data-testid^="weapon-img-"]').first());
    expect(widestShare(iconBoxes, weaponBox)).toBeLessThan(0.3);

    // --- left rail: saves & exploration ---------------------------------------
    const rail = sheet.locator(".osc-rail-extra");
    await expect(rail).toBeVisible();

    const seNav = rail.locator(".osc-se-nav");
    const seTabs = seNav.locator(".osc-se-tab");
    await expect(seTabs).toHaveCount(2);
    const [seNavBox] = await boxesOf(seNav);
    const seTabBoxes = await boxesOf(seTabs);
    expect(rowsOf(seTabBoxes)).toBe(1);
    // `flex: 1` makes the tabs fill the nav whatever their labels say; unstyled
    // they collapse to inline text and leave the bar part-empty. Independent of
    // how many tabs there are, which a per-tab share would not be.
    expect(filledShare(seTabBoxes, seNavBox)).toBeGreaterThan(0.9);

    const saves = rail.locator('[data-testid^="save-"]');
    await expect(saves).toHaveCount(5);
    await expect(saves.first()).toBeVisible();
    // 5-up in the body, 3-up in the narrow rail (3 + 2). The collapse is 5 rows.
    expect(rowsOf(await boxesOf(saves))).toBeLessThanOrEqual(2);

    // Exploration is presence-only. It is deliberately one-per-row in the rail,
    // so a row count says nothing, and every intra-row relation measured against
    // a stripped stylesheet came out too close to the healthy value to separate
    // the two without pinning a design decision.
    await seTabs.nth(1).click();
    await expect(rail.locator(".fvtt-skill").first()).toBeVisible();
    await expect(rail.locator(".fvtt-skill .skv").first()).toBeVisible();

    // --- Inventory tab --------------------------------------------------------
    const inventoryTab = sheet.locator('[data-testid="tab-inventory"]');
    await inventoryTab.click();
    await expect(inventoryTab).toHaveAttribute("aria-selected", "true");
    await expect(sheet.locator('[data-testid="wealth-toggle"]')).toBeVisible();

    const itemRow = sheet.locator('.osc-inv-row:not([data-testid="inv-headrow"])').first();
    await expect(itemRow).toBeVisible();
    await expect(sheet.locator('[data-testid^="equip-"]').first()).toBeVisible();
    // A row is a six-track grid: name, category, load, qty and controls sit on
    // one line. Without the template they stack.
    expect(rowsOf(await boxesOf(itemRow.locator("> *")))).toBe(1);

    // --- Abilities tab --------------------------------------------------------
    const abilitiesTab = sheet.locator('[data-testid="tab-abilities"]');
    await abilitiesTab.click();
    await expect(abilitiesTab).toHaveAttribute("aria-selected", "true");
    await expect(sheet.locator('[data-testid="abilities-tab"]')).toBeVisible();
    await expect(sheet.locator('[aria-label="Add ability"]')).toBeVisible();
    await expect(sheet.locator('[aria-label="Edit languages"]')).toBeVisible();
    await expect(sheet.locator('[data-testid="languages"]')).toBeVisible();

    // --- Notes tab ------------------------------------------------------------
    const notesTab = sheet.locator('[data-testid="tab-notes"]');
    await notesTab.click();
    await expect(notesTab).toHaveAttribute("aria-selected", "true");
    const notes = sheet.locator('[data-testid="notes-tab"]');
    await expect(notes).toBeVisible();
    // Notes + Biography.
    const noteSections = notes.locator('[data-testid="editable-section"]');
    await expect(noteSections).toHaveCount(2);
    await expect(noteSections.nth(1)).toBeVisible();
  });

  test("spells tab renders for a caster", async ({ gamePage, fighter }) => {
    // The fixture fighter is not a caster, so the tab is filtered out. Flip the
    // system flag on this test's own actor; the sheet re-renders on update.
    await gamePage.evaluate(
      (name) =>
        (globalThis as any).game.actors
          .getName(name)
          ?.update({ "system.spells.enabled": true }),
      fighter.name,
    );

    const sheet = await openCharacterSheet(gamePage, fighter.name);
    const spellsTab = sheet.locator('[data-testid="tab-spells"]');
    await expect(spellsTab).toBeVisible();
    await spellsTab.click();
    await expect(spellsTab).toHaveAttribute("aria-selected", "true");
    await expect(sheet.locator('[data-testid="spells-title"]')).toBeVisible();
  });
});
