// Shared markup for the two movement hovers — the header MOVE tile and the
// inventory encumbrance line — so both tell the same story from one source.
// The tier→colour helper lives in @domain/format (see encTierClass).
import type { ReactNode } from "react";
import type { MoveBands } from "@domain/vm-types";
import { cx } from "@ui/cx";

/** Hover popover shell (`.osc-move-pop` — the styles both hovers share). */
export function StatPop({ children }: { children: ReactNode }) {
  return (
    <span className="osc-move-pop" role="tooltip">
      {children}
    </span>
  );
}

/** One key/value line inside a `StatPop`; `vClass` tints the value (tier colour). */
export function PopRow({ k, v, vClass }: { k: ReactNode; v: ReactNode; vClass?: string }) {
  return (
    <span className="r">
      <span className="k">{k}</span>
      <span className={cx("vv", vClass)}>{v}</span>
    </span>
  );
}

/** The three OSE rates as popover rows (per-round · per-turn · per-day). */
export function MoveRateRows({ bands }: { bands: MoveBands }) {
  return (
    <>
      <PopRow k="Encounter" v={`${bands.encounter}′`} />
      <PopRow k="Explore" v={`${bands.explore}′`} />
      <PopRow k="Travel" v={`${bands.travel} mi`} />
    </>
  );
}

/** The same three rates on one line, units inline (ft/turn · ft/round · mi/day). */
export function MoveRates({ bands }: { bands: MoveBands }) {
  return (
    <>
      <span className="rate">
        {bands.explore}′<span className="u">/turn</span>
      </span>
      <span className="sep" aria-hidden="true">
        ·
      </span>
      <span className="rate">
        {bands.encounter}′<span className="u">/round</span>
      </span>
      <span className="sep" aria-hidden="true">
        ·
      </span>
      <span className="rate">
        {bands.travel}
        <span className="u"> mi/day</span>
      </span>
    </>
  );
}
