export const FONT_SCALES = ["compact", "medium", "large"] as const;
export type FontScale = (typeof FONT_SCALES)[number];

// Multiplier on --fs-scale, a clean ± around the legible 16px base (tokens.scss
// emits each --fs-* as `calc(<rem> * var(--fs-scale,1))`): compact ~14px body,
// medium the natural 16px base (default), large ~18px.
export const FONT_SCALE_FACTOR: Record<FontScale, number> = {
  compact: 0.875,
  medium: 1,
  large: 1.125,
};

export function resolveFontScale(value: unknown): FontScale {
  return value === "compact" || value === "large" ? value : "medium";
}

// Apply a font scale to a sheet's root element by setting --fs-scale, the
// multiplier the --fs-* token emit reads. medium (1×) matches the token
// fallback, so it clears the override; compact/large set it explicitly.
export function applyFontScale(root: HTMLElement, scale: FontScale): void {
  if (scale === "medium") root.style.removeProperty("--fs-scale");
  else root.style.setProperty("--fs-scale", String(FONT_SCALE_FACTOR[scale]));
}
