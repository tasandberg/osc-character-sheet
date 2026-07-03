export const THEMES = ["dark", "cream"] as const;
export type Theme = (typeof THEMES)[number];

export function resolveTheme(value: unknown): Theme {
  return value === "cream" ? "cream" : "dark";
}

/** Apply a theme to a sheet's root element. Dark = no attribute (token default). */
export function applyTheme(root: HTMLElement, theme: Theme): void {
  if (theme === "dark") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

// --- theme toggle -------------------------------------------------------------
// The single source of truth is the client setting `osc-character-sheet.theme`. Its
// onChange re-renders every sheet, and reactor-sheet.js `_onRender` applies the
// theme to each *window* element (this.element). The toggle therefore flips the
// SETTING — not a DOM attribute on the inner app, which the window's
// setting-driven data-theme would just override by inheritance.
const SETTING_NS = "osc-character-sheet";
const SETTING_KEY = "theme";

type GameSettings = {
  get(ns: string, key: string): unknown;
  set(ns: string, key: string, value: unknown): Promise<unknown>;
};
const getGame = (): { settings?: GameSettings } | undefined =>
  (globalThis as unknown as { game?: { settings?: GameSettings } }).game;

export function getThemeSetting(): Theme {
  try {
    return resolveTheme(getGame()?.settings?.get(SETTING_NS, SETTING_KEY));
  } catch {
    return "dark";
  }
}

/** Flip dark⇄cream via the client setting; onChange re-renders sheets and
 *  `_onRender` applies it. No-ops outside Foundry (Storybook/tests). */
export function toggleTheme(): void {
  const settings = getGame()?.settings;
  if (!settings) return;
  const next: Theme = getThemeSetting() === "dark" ? "cream" : "dark";
  void settings.set(SETTING_NS, SETTING_KEY, next);
}
