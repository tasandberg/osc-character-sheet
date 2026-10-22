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
  "osc-tb-btn tw:cursor-pointer tw:items-center tw:gap-2 tw:whitespace-nowrap" +
  // inert (display pass) — keep full fidelity, no dimming
  " tw:disabled:cursor-default";

// `up` — the Level Up call to action: solid gold.
const TB_BTN_UP =
  "up tw:border tw:border-gold tw:bg-gold tw:text-on-accent tw:hover:not-disabled:bg-gold-dim" +
  " tw:px-[11px] tw:pt-[6px] tw:pb-[5px] tw:text-(length:--fs-xs) tw:font-semibold";

/** Text button on the topbar: a raised Vellum button. */
export const TB_BTN = `${TB_BTN_BASE} vm-btn vm-btn-secondary osc-btn-muted tw:inline-flex`;

/** Level Up — the one filled button on the bar. */
export const TB_BTN_LEVEL_UP = `${TB_BTN_BASE} vm-btn ${TB_BTN_UP} tw:inline-flex`;

/** Icon-only button (the settings cog): a raised Vellum icon button. */
export const TB_BTN_ICON = `${TB_BTN_BASE} vm-bevel vm-bevel-icon osc-btn-muted icon tw:inline-flex`;

/** The XS ⋮ overflow toggle — the same text button, revealed only at XS. This is
 *  the ONE variant whose display is a base+variant pair rather than a flat
 *  `inline-flex`, which is why display is not in TB_BTN_BASE. */
export const TB_BTN_OVERFLOW = `${TB_BTN_BASE} vm-btn vm-btn-secondary osc-btn-muted tw:hidden tw:@max-md/app:inline-flex`;

/** Leading glyph inside a topbar button. `leading-flush` stops the taller glyph
 *  line box from growing the button past its siblings. */
export const TB_BTN_GLYPH = "i tw:text-(length:--fs-xs) tw:leading-flush";
