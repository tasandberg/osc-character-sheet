// The movement hover popover, shared by the header MOVE tile and the inventory
// encumbrance line. `MoveTooltip` is the single source for the popover BODY — both
// call sites render it, neither re-composes the rows, so the two hovers can never
// drift apart again. The tier→colour helper lives in @domain/format (encTierClass).
//
// The popover is `position: fixed`, positioned in JS off its trigger's rect. Fixed
// (with no transformed ancestor — verified for the sheet shell) is NOT clipped by an
// ancestor's `overflow: auto/hidden`, so the popover renders in full even when it
// lives inside a self-scrolling container like the capped character rail.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { EncumbranceTier, MoveBands } from "@domain/vm-types";
import { encTierClass } from "@domain/format";
import { cx } from "@ui/cx";

/** A rate line: label + number + unit, laid out as three grid cells so the numbers
    align in one column and the units in the next (see .osc-move-pop grid). */
function RateRow({ k, n, u }: { k: ReactNode; n: ReactNode; u: ReactNode }) {
  return (
    <span className="r">
      <span className="k">{k}</span>
      <span className="num">{n}</span>
      <span className="unit">{u}</span>
    </span>
  );
}

/** A status line: label + a value spanning the number+unit columns; `vClass` tints it. */
function PopRow({ k, v, vClass }: { k: ReactNode; v: ReactNode; vClass?: string }) {
  return (
    <span className="r">
      <span className="k">{k}</span>
      <span className={cx("vv", vClass)}>{v}</span>
    </span>
  );
}

// Hidden until the trigger (this element's parent) is hovered/focused; then pinned
// with `position: fixed` just under the trigger. Repositions on scroll/resize so it
// stays glued while open. Returns the ref for the popover element + its inline style.
function useTriggerAnchoredFixed(): {
  ref: React.RefObject<HTMLSpanElement | null>;
  style: CSSProperties;
} {
  const ref = useRef<HTMLSpanElement>(null);
  const [style, setStyle] = useState<CSSProperties>({ display: "none" });

  useEffect(() => {
    const trigger = ref.current?.parentElement;
    if (!trigger) return;
    let open = false;
    const place = () => {
      const r = trigger.getBoundingClientRect();
      setStyle({ position: "fixed", top: r.bottom + 6, left: r.left });
    };
    const show = () => {
      open = true;
      place();
    };
    const hide = () => {
      open = false;
      setStyle({ display: "none" });
    };
    const reposition = () => {
      if (open) place();
    };
    trigger.addEventListener("pointerenter", show);
    trigger.addEventListener("pointerleave", hide);
    trigger.addEventListener("focusin", show);
    trigger.addEventListener("focusout", hide);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      trigger.removeEventListener("pointerenter", show);
      trigger.removeEventListener("pointerleave", hide);
      trigger.removeEventListener("focusin", show);
      trigger.removeEventListener("focusout", hide);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, []);

  return { ref, style };
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
}: {
  bands: MoveBands;
  /** Omit both to show rates only (e.g. encumbrance tracking disabled). */
  tier?: EncumbranceTier;
  status?: string;
}) {
  const { ref, style } = useTriggerAnchoredFixed();
  return (
    <span className="osc-move-pop" role="tooltip" ref={ref} style={style}>
      <span className="hd">Movement</span>
      {/* per-unit suffixes match the OSE rate the value is quoted in — don't cross
          them: explore is per turn, encounter per round, travel miles per day. */}
      <RateRow k="Encounter" n={bands.encounter} u="ft/round" />
      <RateRow k="Explore" n={bands.explore} u="ft/turn" />
      <RateRow k="Travel" n={bands.travel} u="mi/day" />
      {tier !== undefined && status && (
        <PopRow k="Encumbrance" v={status} vClass={encTierClass(tier)} />
      )}
    </span>
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
