import { useEffect, useRef, useState } from "react";
import type { IdentityVM, VitalsVM } from "@domain/vm-types";
import { Stamp } from "@ui/Stamp";
import { useHpInput } from "@ui/useHpInput";

type Props = {
  identity: IdentityVM;
  vitals: VitalsVM;
  /** Commit a new current-HP value (already clamped by the caller). */
  onSetHp?: (value: number) => void;
};

/**
 * Pinned minibar shown only in the MEDIUM layout band (single-column sheet, header
 * scrolls away). CSS container gates hide it at xs and lg; this component owns the
 * collapse logic: it watches its own `.rs-sheet` scroller (never a global query —
 * multiple sheets can be open) and toggles `is-collapsed` once the name scrolls out.
 */
export function Minibar({ identity, vitals, onSetHp }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const hp = useHpInput({ value: vitals.hp.value, max: vitals.hp.max, onSet: onSetHp ?? (() => {}) });

  useEffect(() => {
    const scroller = ref.current?.closest<HTMLElement>(".rs-sheet");
    if (!scroller) return;

    // Threshold = scroll past the bottom of the name (with an 8px lead-in). The
    // name's font-size shifts across breakpoints, so recompute on resize.
    let threshold = 0;
    const recompute = () => {
      const name = scroller.querySelector<HTMLElement>(".rs-name");
      threshold = name ? Math.max(8, name.offsetTop + name.offsetHeight - 8) : 8;
      onScroll();
    };
    const onScroll = () => setCollapsed(scroller.scrollTop > threshold);

    recompute();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(recompute);
    ro.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={`rs-minibar${collapsed ? " is-collapsed" : ""}`} aria-hidden={!collapsed}>
      <img className="rs-mb-portrait" src={identity.img || undefined} alt="" />
      <div className="rs-mb-ident">
        <div className="rs-mb-name">{identity.name}</div>
        <div className="rs-mb-class">{identity.classLabel} {identity.level}</div>
      </div>
      <div className="rs-mb-vitals">
        <div className="rs-mb-hp">
          {/* hover swaps label/max → −/+ steppers; grid-stacked so width never shifts */}
          <span className="rs-mb-hp-slot">
            <Stamp className="rs-mb-stamp">HP</Stamp>
            {onSetHp && (
              <button
                type="button"
                className="rs-mb-hp-btn"
                aria-label="Decrease HP"
                tabIndex={-1}
                onClick={hp.dec}
              >
                −
              </button>
            )}
          </span>
          {onSetHp ? (
            <input
              className="rs-mb-hp-input"
              aria-label="Current HP"
              key={hp.key}
              {...hp.inputProps}
            />
          ) : (
            <span className="rs-mb-hp-input rs-mb-hp-static">{vitals.hp.value}</span>
          )}
          <span className="rs-mb-hp-slot">
            <span className="rs-mb-hp-max">/{vitals.hp.max}</span>
            {onSetHp && (
              <button
                type="button"
                className="rs-mb-hp-btn"
                aria-label="Increase HP"
                tabIndex={-1}
                onClick={hp.inc}
              >
                +
              </button>
            )}
          </span>
        </div>
        <div className="rs-mb-ac">
          <Stamp className="rs-mb-stamp">AC</Stamp>
          <span className="rs-mb-ac-v">{vitals.ac.value}</span>
        </div>
      </div>
    </div>
  );
}
