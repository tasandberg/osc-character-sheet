// Tailwind class strings for inventory-row markup rendered from more than one
// file. The semantic `osc-inv-*` name leads each string and stays on the element:
// tests select on it, and what's left in styles/inventory/_rows.scss (the grid
// template, the drop-insertion line, the nesting rail) keys off it too.
//
// Every utility carries the `tw:` prefix — Foundry ships its own `.flex`,
// `.hidden` and `.active`, and an unprefixed utility both collides and fails to
// compile. Tiers are container queries on `app`, never viewport breakpoints.

// Row shell minus its rule. `display: grid` and the 6-track template stay in
// _rows.scss. The rule colour is split out because Tailwind orders utilities
// within the layer by its own rules, not by the order they appear on the
// element: `tw:border-border` is emitted BEFORE `tw:border-border-soft`, so a
// head row carrying both would come out soft. Two exclusive strings instead.
const ROW_BASE =
  "osc-inv-row tw:items-center tw:gap-3 tw:px-1 tw:py-2 tw:transition-[background] tw:duration-100";

/** Body row (item / container / coin). Hairline rule between rows. */
export const INV_ROW = `${ROW_BASE} tw:border-b tw:border-border-soft`;

/** Column-header row: heavier rule, no top pad, and no hover tint — it isn't a
 *  drop target. */
export const INV_HEADROW = `${ROW_BASE} tw:pt-0 tw:pb-1 tw:border-b-2 tw:border-border tw:hover:bg-transparent`;

/** Small-caps micro label — the sort headers, the static "Equip" head and the
 *  per-row category badge are typographically the same thing. Colour is NOT
 *  included: the sort header swaps it per state, and utilities in one layer are
 *  ordered by Tailwind, not by the order you write them, so a `tw:text-text`
 *  written "after" a `tw:text-text-faint` here would still lose to it. */
export const MICRO_LABEL =
  "tw:font-sans tw:text-[length:var(--fs-3xs)] tw:font-semibold tw:tracking-[0.08em] tw:uppercase";

/** Per-row category badge (col 4). Dropped at xs to buy the name column width. */
export const INV_ROWCAT = `${MICRO_LABEL} tw:text-text-faint tw:whitespace-nowrap tw:text-left tw:@max-md/app:hidden`;

/** Load cell (col 5) — "N cn" / "N slots" / "—". */
export const INV_WT =
  "tw:font-mono tw:text-[length:var(--fs-xs)] tw:text-text-mute tw:text-center tw:whitespace-nowrap";

/** Inline meta suffix after the item name — weapon damage, stack quantity. */
export const INV_QTYTAG =
  "osc-inv-qtytag tw:font-mono tw:text-[length:var(--fs-2xs)] tw:text-text-mute tw:whitespace-nowrap tw:flex-none";
