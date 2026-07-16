// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Topbar } from "@layout/Topbar";
import type { TopbarVM } from "@domain/vm-types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const vm: TopbarVM = {
  level: 3,
  nextLevel: 4,
  xp: { value: 6420, next: 10000 },
  pct: 28.4,
};

// Map-backed game.settings so getThemeSetting/getFontScaleSetting read a real
// value and the setters have something to write to.
const store = new Map<string, unknown>([["osc-character-sheet.theme", "dark"]]);
const set = vi.fn((ns: string, key: string, value: unknown) => {
  store.set(`${ns}.${key}`, value);
  return Promise.resolve(value);
});

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  set.mockClear();
  (globalThis as { game?: unknown }).game = {
    settings: { get: (ns: string, key: string) => store.get(`${ns}.${key}`), set },
  };
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete (globalThis as { game?: unknown }).game;
});

const q = (sel: string) => container.querySelector<HTMLElement>(sel);
const byText = (sel: string, text: string) =>
  [...container.querySelectorAll<HTMLElement>(sel)].find((el) => el.textContent === text);

describe("Topbar settings", () => {
  it("renders a cog trigger and no theme/font controls until opened", () => {
    act(() => root.render(<Topbar vm={vm} onEdit={() => {}} onLevelUp={() => {}} />));
    expect(q('[aria-label="Settings"] .fa-gear')).toBeTruthy();
    expect(q(".modal")).toBeNull();
  });

  it("opens the settings modal on cog click", () => {
    act(() => root.render(<Topbar vm={vm} onEdit={() => {}} onLevelUp={() => {}} />));
    act(() => q('[aria-label="Settings"]')!.click());
    expect(q(".modal-head .ttl")?.textContent).toBe("Settings");
    // both settings groups present
    expect(q('[aria-label="Theme"]')).toBeTruthy();
    expect(q('[aria-label="Font size"]')).toBeTruthy();
  });

  it("writes the theme and font-size settings from the modal controls", () => {
    act(() => root.render(<Topbar vm={vm} onEdit={() => {}} onLevelUp={() => {}} />));
    act(() => q('[aria-label="Settings"]')!.click());

    act(() => byText('[aria-label="Theme"] button', "Cream")!.click());
    expect(set).toHaveBeenCalledWith("osc-character-sheet", "theme", "cream");

    act(() => byText('[aria-label="Font size"] button', "A++")!.click());
    expect(set).toHaveBeenCalledWith("osc-character-sheet", "fontScale", "xl");
  });
});
