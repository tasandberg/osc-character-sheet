import type { Locator, Page } from "@playwright/test";
import { test, expect } from "../fixtures";
import { openCharacterSheet } from "../helpers";

const MODULE_ID = "osc-character-sheet";

type Rgb = [number, number, number];

async function setSetting(page: Page, key: string, value: string): Promise<void> {
  await page.evaluate(
    ([mod, k, v]) => (globalThis as any).game.settings.set(mod, k, v),
    [MODULE_ID, key, value],
  );
}

async function labelStyle(label: Locator): Promise<{ fontSize: number; fg: Rgb; bg: Rgb }> {
  return label.evaluate((el) => {
    const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number);
    let bgEl: Element | null = el;
    let bg = rgb(getComputedStyle(el).backgroundColor);
    while (bgEl && (bg.length < 3 || bg[3] === 0)) {
      bgEl = bgEl.parentElement;
      if (bgEl) bg = rgb(getComputedStyle(bgEl).backgroundColor);
    }
    const style = getComputedStyle(el);
    return {
      fontSize: parseFloat(style.fontSize),
      fg: rgb(style.color).slice(0, 3) as Rgb,
      bg: bg.slice(0, 3) as Rgb,
    };
  });
}

function contrast(a: Rgb, b: Rgb): number {
  const luminance = (c: Rgb) => {
    const [r, g, bl] = c.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test.describe("text readability", () => {
  test("save labels scale with the font setting and meet AA contrast", async ({
    gamePage,
    fighter,
  }) => {
    try {
      const sheet = await openCharacterSheet(gamePage, fighter.name);
      const label = sheet.locator('[data-testid="save-death"]:visible .pc').first();
      await expect(label).toBeVisible();

      const medium = await labelStyle(label);
      expect(medium.fontSize).toBeGreaterThanOrEqual(12);
      expect(contrast(medium.fg, medium.bg)).toBeGreaterThanOrEqual(4.5);

      await setSetting(gamePage, "fontScale", "large");
      await expect
        .poll(async () => (await labelStyle(label)).fontSize)
        .toBeGreaterThan(medium.fontSize);
      expect((await labelStyle(label)).fontSize).toBeCloseTo(medium.fontSize * 1.125, 1);

      await setSetting(gamePage, "theme", "cream");
      await expect(sheet).toHaveAttribute("data-theme", "cream");
      const cream = await labelStyle(label);
      expect(contrast(cream.fg, cream.bg)).toBeGreaterThanOrEqual(4.5);
    } finally {
      await setSetting(gamePage, "fontScale", "medium");
      await setSetting(gamePage, "theme", "dark");
    }
  });
});
