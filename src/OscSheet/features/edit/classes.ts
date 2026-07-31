// Tailwind class strings for Edit-modal markup rendered from more than one file.
// The semantic name leads each string and stays on the element: `.ed-field` is a
// test hook (EditModal.movement.test.tsx / EditModalClass.test.tsx) and what is
// left in styles/edit-modal.scss keys off it too.
//
// Every utility carries the `tw:` prefix — Foundry ships its own `.flex`,
// `.hidden` and `.active`, and an unprefixed utility both collides and fails to
// compile. Tiers are container queries on `fwin` (the modal, declared in
// edit-modal.scss), never viewport breakpoints.
//
// Sizes go through `var(--fs-*)` rather than the `tw:text-*` scale: the tokens
// are `calc(<rem> * var(--fs-scale))` and follow the sheet's font-size setting,
// the Tailwind scale is the raw rem.

/** Field wrapper. `relative` is the positioning context for `.ed-rollbtn`. */
export const ED_FIELD =
  "ed-field tw:relative tw:flex tw:flex-col tw:gap-[5px] tw:min-w-0";

// Small-caps micro label above a field. The identity grid and the exploration
// grid want different type, and they differ on `tracking` — utilities in one
// layer are ordered by Tailwind, not by the order they are written, so a shared
// base plus a per-variant override could come out either way. Two exclusive
// strings instead.
const LAB_BASE =
  "lab tw:font-sans tw:text-[length:var(--fs-3xs)] tw:font-semibold tw:uppercase tw:text-text-dim";

/** Identity-grid label. The 12-col tracks are narrow, so it truncates rather
 *  than widening its field, and tightens tracking to buy characters. */
export const LAB_ID = `${LAB_BASE} tw:tracking-[0.06em] tw:whitespace-nowrap tw:overflow-hidden tw:text-ellipsis`;

/** Exploration label — a real serif italic (skill names read as prose, not as
 *  stamped keys), so it shares nothing with LAB_BASE but its colour. */
export const LAB_SKILL =
  "lab tw:font-serif tw:italic tw:normal-case tw:text-[length:var(--fs-xs)] tw:font-normal tw:tracking-[0.02em] tw:text-text-dim";

/** Inline annotation inside a label (the GM-only marker on Class). */
export const ED_HINT =
  "hint tw:font-mono tw:text-[length:var(--fs-3xs)] tw:leading-[1.4] tw:text-text-mute";

/** Identity-grid span: half-width fields at the wide tier, and at the narrow
 *  tier the 12-col grid stays but every field goes half-row. */
export const SPAN_2 = "tw:col-span-2 tw:@max-[560px]/fwin:col-span-6";
export const SPAN_3 = "tw:col-span-3 tw:@max-[560px]/fwin:col-span-6";
export const SPAN_4 = "tw:col-span-4 tw:@max-[560px]/fwin:col-span-6";

/** Comboboxes need the whole row once the modal is narrow — their popup list
 *  and chip do not fit a half track. */
export const SPAN_COMBO = "tw:col-span-4 tw:@max-[560px]/fwin:col-span-12";
