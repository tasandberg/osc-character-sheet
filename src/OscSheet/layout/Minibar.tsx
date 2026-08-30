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
 * collapse logic: it watches its own `.osc-sheet-body` scroller (never a global query —
 * multiple sheets can be open) and toggles `is-collapsed` once the name scrolls out.
 */
export function Minibar({ identity, vitals, onSetHp }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const hp = useHpInput({ value: vitals.hp.value, max: vitals.hp.max, onSet: onSetHp ?? (() => {}) });

  useEffect(() => {
    const scroller = ref.current?.closest<HTMLElement>(".osc-sheet-body");
    if (!scroller) return;

    // Threshold = scroll past the bottom of the name (with an 8px lead-in). The
    // name's font-size shifts across breakpoints, so recompute on resize.
    let threshold = 0;
    const recompute = () => {
      const name = scroller.querySelector<HTMLElement>(".osc-name");
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
    <div ref={ref} className={`osc-minibar${collapsed ? " is-collapsed" : ""}`} aria-hidden={!collapsed}>
      <img
        className="osc-mb-portrait tw:h-8 tw:w-8 tw:flex-none tw:rounded-sm tw:border tw:border-border-soft tw:object-cover"
        src={identity.img || undefined}
        alt=""
      />
      <div className="tw:min-w-0 tw:flex-auto">
        <div className="tw:truncate tw:font-display tw:text-[length:var(--fs-md)] tw:leading-tight tw:text-text">
          {identity.name}
        </div>
        <div className="tw:truncate tw:font-mono tw:text-[length:var(--fs-2xs)] tw:text-text-mute">
          {identity.classLabel} {identity.level}
        </div>
      </div>
      <div className="tw:flex tw:flex-none tw:items-center tw:gap-2">
        <div className="osc-mb-hp">
          {/* hover swaps label/max → −/+ steppers; grid-stacked so width never shifts */}
          <span className="osc-mb-hp-slot">
            <Stamp className="osc-mb-stamp">HP</Stamp>
            {onSetHp && (
              <button
                type="button"
                className="osc-mb-hp-btn"
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
              className="osc-mb-hp-input"
              aria-label="Current HP"
              key={hp.key}
              {...hp.inputProps}
            />
          ) : (
            <span className="osc-mb-hp-input osc-mb-hp-static">{vitals.hp.value}</span>
          )}
          <span className="osc-mb-hp-slot">
            <span className="osc-mb-hp-max tw:font-mono tw:text-[length:var(--fs-2xs)] tw:text-text-mute">
              /{vitals.hp.max}
            </span>
            {onSetHp && (
              <button
                type="button"
                className="osc-mb-hp-btn"
                aria-label="Increase HP"
                tabIndex={-1}
                onClick={hp.inc}
              >
                +
              </button>
            )}
          </span>
        </div>
        <div className="osc-mb-ac">
          <Stamp className="osc-mb-stamp">AC</Stamp>
          <span className="osc-mb-ac-v tw:font-display tw:text-[length:var(--fs-2xl)] tw:leading-flush tw:text-teal">
            {vitals.ac.value}
          </span>
        </div>
      </div>
    </div>
  );
}
