// The movement hover popover, shared by the header MOVE tile and the inventory
// encumbrance line. `MoveTooltip` is the single source for the popover BODY — both
// call sites render it, neither re-composes the rows, so the two hovers can never
// drift apart again. The tier→colour helper lives in @domain/format (encTierClass).
//
// Placement/visibility is HoverPop's job (fixed + JS-anchored, so no ancestor's
// `overflow: auto` can clip it); this file only supplies the rows.
import { type ReactNode } from "react";
import type { EncumbranceTier, MoveBands } from "@domain/vm-types";
import { encTierClass } from "@domain/format";
import { cx } from "@ui/cx";
import { HoverPop } from "@ui/HoverPop";

/** A rate line: label + a right-aligned value (number + unit). The value shares the
    single right-aligned column with the status rows, so every value ends flush at the
    table's right edge (see .osc-move-pop grid). */
// The row dissolves so its two cells land directly in the popover's grid — that
// is what puts every value, rate and status alike, in one right-aligned column.
const ROW = "r tw:contents";
const K = "k tw:font-sans tw:text-[length:var(--fs-xs)] tw:text-text-dim";
// The value cell keeps the body colour and is tinted only on a row carrying an
// `.enc-t*` class, which is what sets --enc-c. `nowrap` so the pop widens for
// "Severely encumbered" rather than wrapping it.
const VV =
  "vv tw:col-start-2 tw:text-right tw:font-mono tw:text-[length:var(--fs-xs)]" +
  " tw:whitespace-nowrap tw:text-[var(--enc-c,var(--text))]";

function RateRow({ k, n, u }: { k: ReactNode; n: ReactNode; u: ReactNode }) {
  return (
    <span className={ROW}>
      <span className={K}>{k}</span>
      <span className={VV}>
        {/* on a rate row the number keeps the value colour; only the unit dims */}
        <span className="num">{n}</span> <span className="unit tw:text-text-mute">{u}</span>
      </span>
    </span>
  );
}

/** A status line: label + a right-aligned value; `vClass` tints it. */
function PopRow({ k, v, vClass }: { k: ReactNode; v: ReactNode; vClass?: string }) {
  return (
    <span className={ROW}>
      <span className={K}>{k}</span>
      <span className={cx(VV, vClass)}>{v}</span>
    </span>
  );
}

/**
 * The one and only movement popover body: the three OSE rates (full labels, each in
 * its own unit) plus the encumbrance tier that explains them. Rendered verbatim by
 * BOTH the header MOVE tile and the encumbrance line — change it here, both change.
 * Must be placed as a direct child of the trigger element (its parent = the anchor).
 */
export function MoveTooltip({
  bands,
  tier,
  status,
  armor,
}: {
  bands: MoveBands;
  /** Omit both to show rates only (e.g. encumbrance tracking disabled). */
  tier?: EncumbranceTier;
  status?: string;
  /** Basic mode only: equipped armor tier label ("Light"/"Heavy"). Its own row since
      armor slows movement without colouring the encumbrance bar. */
  armor?: string;
}) {
  return (
    // `--enc-c: initial` so the pop doesn't inherit the anchor's tier tint —
    // only a `.vv` on an `.enc-t*` row opts back in. The 2-col grid's label
    // column grows to eat the slack, so every value ends flush at the right.
    <HoverPop className="osc-move-pop tw:grid tw:min-w-[150px] tw:grid-cols-[minmax(max-content,1fr)_max-content] tw:gap-x-3 tw:gap-y-[3px] tw:[--enc-c:initial]">
      <span className="hd tw:col-span-full tw:mb-[2px] tw:border-b tw:border-border-soft tw:pb-[3px] tw:font-sans tw:text-[length:var(--fs-3xs)] tw:font-semibold tw:tracking-[0.08em] tw:text-text-mute tw:uppercase">
        Movement
      </span>
      {armor && <PopRow k="Armor" v={armor} />}
      {tier !== undefined && status && (
        <PopRow k="Encumbrance" v={status} vClass={encTierClass(tier)} />
      )}
      {/* the row label (Encounter/Explore/Travel) already names the OSE time frame,
          so the value carries only its distance unit — ft for the two on-map rates,
          mi for overland travel. */}
      <RateRow k="Encounter" n={bands.encounter} u="ft" />
      <RateRow k="Explore" n={bands.explore} u="ft" />
      <RateRow k="Travel" n={bands.travel} u="mi" />
    </HoverPop>
  );
}

/** The three rates on one line, terse: `40ft / 120ft / 24mi` (encounter / explore / travel). */
export function MoveRates({ bands }: { bands: MoveBands }) {
  return (
    <>
      <span className="rate">{bands.encounter}ft</span>
      <span className="sep" aria-hidden="true">
        /
      </span>
      <span className="rate">{bands.explore}ft</span>
      <span className="sep" aria-hidden="true">
        /
      </span>
      <span className="rate">{bands.travel}mi</span>
    </>
  );
}
