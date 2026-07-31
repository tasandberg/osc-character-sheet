// Tailwind class strings for shell markup rendered from more than one file.
// The semantic `osc-*` name leads each string and stays on the element — the
// topbar's remaining SCSS (`.osc-tb-menu .osc-tb-btn`) keys off it.
//
// Every utility carries the `tw:` prefix — Foundry ships its own `.flex`,
// `.hidden` and `.active`, and an unprefixed utility both collides and fails to
// compile. Tiers are container queries on `app`, never viewport breakpoints.
//
// Sizes go through `var(--fs-*)` rather than the `tw:text-*` scale: the tokens
// are `calc(<rem> * var(--fs-scale))` and follow the sheet's font-size setting,
// the Tailwind scale is the raw rem.

// Topbar button — the type and chrome every variant shares. Deliberately carries
// NO display, NO colour and NO padding: each differs per variant, and two
// utilities for one property are ordered by Tailwind rather than by the order
// they are written on the element, so a shared base plus an override could come
// out either way. The variants below are exclusive strings instead.
const TB_BTN_BASE =
  "osc-tb-btn tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-sm tw:border" +
  " tw:font-sans tw:text-[length:var(--fs-3xs)] tw:font-medium" +
  " tw:tracking-[0.08em] tw:whitespace-nowrap tw:uppercase" +
  " tw:transition-[color,border-color,background] tw:duration-[120ms]" +
  // inert (display pass) — keep full fidelity, no dimming
  " tw:disabled:cursor-default";

// Idle: a hairline on the always-dark bar. The stamp-* tokens are constant
// across themes, so these read identically in dark and cream.
const TB_BTN_IDLE =
  "tw:border-[rgba(229,222,200,0.18)] tw:bg-transparent tw:text-stamp-text-dim" +
  " tw:hover:not-disabled:border-[rgba(229,222,200,0.4)] tw:hover:not-disabled:text-stamp-text";

// `up` — the Level Up call to action: solid gold rather than a hairline.
const TB_BTN_UP =
  "up tw:border-gold tw:bg-gold tw:text-on-accent tw:hover:not-disabled:bg-gold-dim";

const TB_BTN_PAD = "tw:px-[11px] tw:pt-[6px] tw:pb-[5px]";

/** Text button on the topbar. */
export const TB_BTN = `${TB_BTN_BASE} ${TB_BTN_IDLE} ${TB_BTN_PAD} tw:inline-flex`;

/** Level Up — the one filled button on the bar. */
export const TB_BTN_LEVEL_UP = `${TB_BTN_BASE} ${TB_BTN_UP} ${TB_BTN_PAD} tw:inline-flex`;

/** Icon-only button (the settings cog): a glyph with no label, so the label's
 *  side padding would read as slack. */
export const TB_BTN_ICON =
  `${TB_BTN_BASE} ${TB_BTN_IDLE} icon tw:inline-flex tw:px-2 tw:py-[6px]`;

/** The XS ⋮ overflow toggle — the same text button, revealed only at XS. This is
 *  the ONE variant whose display is a base+variant pair rather than a flat
 *  `inline-flex`, which is why display is not in TB_BTN_BASE. */
export const TB_BTN_OVERFLOW =
  `${TB_BTN_BASE} ${TB_BTN_IDLE} ${TB_BTN_PAD} osc-tb-overflow tw:hidden tw:@max-md/app:inline-flex`;

/** Leading glyph inside a topbar button. `leading-flush` stops the taller glyph
 *  line box from growing the button past its siblings. */
export const TB_BTN_GLYPH = "i tw:text-[length:var(--fs-xs)] tw:leading-flush";
