// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { watchFoundryColorScheme } from "@src/OscSheet/theme";
import { sheetFontScale, sheetTheme } from "@src/OscSheet/appearance";

const settings = {
  theme: "system",
  fontScale: "medium",
  monsterTheme: "inherit",
  monsterFontScale: "inherit",
} as const;

afterEach(() => {
  document.body.className = "";
});

describe("sheet theme", () => {
  it("follows Foundry's colour scheme when set to System", () => {
    expect(sheetTheme("character", settings)).toBe("dark");
    document.body.classList.add("theme-light");
    expect(sheetTheme("character", settings)).toBe("cream");
  });

  it("keeps an explicit choice regardless of Foundry's scheme", () => {
    document.body.classList.add("theme-light");
    expect(sheetTheme("character", { ...settings, theme: "dark" })).toBe(
      "dark",
    );
  });

  it("gives the monster sheet the character sheet's theme and font size by default", () => {
    const character = {
      ...settings,
      theme: "cream",
      fontScale: "large",
    } as const;
    expect(sheetTheme("monster", character)).toBe("cream");
    expect(sheetFontScale("monster", character)).toBe("large");
  });

  it("lets the monster sheet override the character sheet", () => {
    const own = {
      ...settings,
      theme: "cream",
      monsterTheme: "dark",
      monsterFontScale: "compact",
    } as const;
    expect(sheetTheme("monster", own)).toBe("dark");
    expect(sheetFontScale("monster", own)).toBe("compact");
    expect(sheetTheme("character", own)).toBe("cream");
  });
});

describe("watchFoundryColorScheme", () => {
  it("notifies when Foundry switches colour scheme, not on other class changes", async () => {
    document.body.classList.add("theme-dark");
    const onChange = vi.fn();
    const stop = watchFoundryColorScheme(onChange);
    document.body.classList.add("performance-high");
    await Promise.resolve();
    expect(onChange).not.toHaveBeenCalled();
    document.body.classList.replace("theme-dark", "theme-light");
    await Promise.resolve();
    expect(onChange).toHaveBeenCalledTimes(1);
    stop();
  });
});
