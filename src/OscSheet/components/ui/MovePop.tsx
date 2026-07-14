// The movement hover popover, shared by the header MOVE tile and the inventory
// encumbrance line. `MoveTooltip` is the single source for the popover BODY — both
// call sites render it, neither re-composes the rows, so the two hovers can never
// drift apart again. The tier→colour helper lives in @domain/format (encTierClass).
import type { ReactNode } from "react";
import type { EncumbranceTier, MoveBands } from "@domain/vm-types";
import { encTierClass } from "@domain/format";
import { cx } from "@ui/cx";

/** Hover popover shell (`.osc-move-pop` — the styles both hovers share). */
function StatPop({ children }: { children: ReactNode }) {
  return (
    <span className="osc-move-pop" role="tooltip">
      {children}
    </span>
  );
}

/** One key/value line inside the popover; `vClass` tints the value (tier colour). */
function PopRow({ k, v, vClass }: { k: ReactNode; v: ReactNode; vClass?: string }) {
  return (
    <span className="r">
      <span className="k">{k}</span>
      <span className={cx("vv", vClass)}>{v}</span>
    </span>
  );
}

/**
 * The one and only movement popover body: the three OSE rates (full labels) plus
 * the encumbrance tier that explains them. Rendered verbatim by BOTH the header MOVE
 * tile and the encumbrance line — change it here, both change.
 */
export function MoveTooltip({
  bands,
  tier,
  status,
}: {
  bands: MoveBands;
  /** Omit both to show rates only (e.g. encumbrance tracking disabled). */
  tier?: EncumbranceTier;
  status?: string;
}) {
  return (
    <StatPop>
      <PopRow k="Encounter" v={`${bands.encounter}′`} />
      <PopRow k="Explore" v={`${bands.explore}′`} />
      <PopRow k="Travel" v={`${bands.travel} mi`} />
      {tier !== undefined && status && (
        <PopRow k="Encumbrance" v={status} vClass={encTierClass(tier)} />
      )}
    </StatPop>
  );
}

/** The three rates on one line, terse: `120′ · 40′ · 24mi` (explore · encounter · travel). */
export function MoveRates({ bands }: { bands: MoveBands }) {
  return (
    <>
      <span className="rate">{bands.explore}′</span>
      <span className="sep" aria-hidden="true">
        ·
      </span>
      <span className="rate">{bands.encounter}′</span>
      <span className="sep" aria-hidden="true">
        ·
      </span>
      <span className="rate">{bands.travel}mi</span>
    </>
  );
}
