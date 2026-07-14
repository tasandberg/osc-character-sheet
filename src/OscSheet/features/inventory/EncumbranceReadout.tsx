// Encumbrance readout above the load bar: the numeric load (X / 1600 cn, muted) and
// the three movement rates (terse, tinted by tier). The rates replace the old tier
// WORD — the load number stays. Hover shows the shared MoveTooltip: same rows, same
// component as the header MOVE stat hover.
import type { EncumbranceVM } from "@domain/vm-types";
import { encTierClass, moveRatesLabel } from "@domain/format";
import { cx } from "@ui/cx";
import { MoveRates, MoveTooltip } from "@ui/MovePop";

export function EncumbranceReadout({ e }: { e: EncumbranceVM }) {
  const tier = encTierClass(e.tier);
  return (
    <span
      className={cx("osc-enc-readout", tier)}
      // focusable so the hover-only popover is reachable by keyboard (:focus-within)
      tabIndex={0}
      aria-label={`${e.status}. ${e.label ? `Load ${e.label}. ` : ""}Movement: ${moveRatesLabel(e.moveBands)}`}
    >
      {e.label && (
        <>
          <span className="load">{e.label}</span>
          <span className="sep" aria-hidden="true">
            ·
          </span>
        </>
      )}
      <MoveRates bands={e.moveBands} />
      <MoveTooltip bands={e.moveBands} tier={e.tier} status={e.status} />
    </span>
  );
}
