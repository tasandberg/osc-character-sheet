export const FONT_SCALES = ["compact", "medium", "large"] as const;
export type FontScale = (typeof FONT_SCALES)[number];

// Multiplier baked into each --fs-* token emit (tokens.scss: `calc(<rem> *
// var(--fs-scale,1))`), so raising it grows every token-sized text at once.
// medium (1.15×) is the default. Deferred follow-up: bake 1.15 into the base
// rem and make compact/large relative, so the default needs no --fs-scale.
export const FONT_SCALE_FACTOR: Record<FontScale, number> = {
  compact: 1,
  medium: 1.15,
  large: 1.3,
};

export function resolveFontScale(value: unknown): FontScale {
  return value === "compact" || value === "large" ? value : "medium";
}

// Apply a font scale to a sheet's root element by setting --fs-scale, the
// multiplier the --fs-* token emit reads. compact (1×) matches the token
// fallback, so it clears the override; medium/large set it explicitly.
export function applyFontScale(root: HTMLElement, scale: FontScale): void {
  if (scale === "compact") root.style.removeProperty("--fs-scale");
  else root.style.setProperty("--fs-scale", String(FONT_SCALE_FACTOR[scale]));
}

// Mirrors theme.ts: the single source of truth is the client setting
// `osc-character-sheet.fontScale`. Its onChange re-renders every sheet, and
// osc-sheet.js `_onRender` applies the scale to each window element.
const SETTING_NS = "osc-character-sheet";
const SETTING_KEY = "fontScale";

type GameSettings = {
  get(ns: string, key: string): unknown;
  set(ns: string, key: string, value: unknown): Promise<unknown>;
};
const getGame = (): { settings?: GameSettings } | undefined =>
  (globalThis as unknown as { game?: { settings?: GameSettings } }).game;

export function getFontScaleSetting(): FontScale {
  try {
    return resolveFontScale(getGame()?.settings?.get(SETTING_NS, SETTING_KEY));
  } catch {
    return "medium";
  }
}

/** Set the font scale via the client setting; onChange re-renders sheets and
 *  `_onRender` applies it. No-ops outside Foundry (Storybook/tests). */
export function setFontScale(scale: FontScale): void {
  void getGame()?.settings?.set(SETTING_NS, SETTING_KEY, scale);
}
