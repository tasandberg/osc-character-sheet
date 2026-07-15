// Encumbrance readout above the load bar: the three movement rates on the LEFT
// (terse, tinted by tier) and the numeric load (X / 1600 cn, muted) pushed to the
// RIGHT edge so it lines up with the cn totals on the section headers below. The
// rates replace the old tier WORD — the load number stays. Hover shows the shared
// MoveTooltip: same rows, same component as the header MOVE stat hover.
import type { EncumbranceVM } from "@domain/vm-types";
import { encTierClass, moveRatesLabel } from "@domain/format";
import { cx } from "@ui/cx";
import { MoveRates, MoveTooltip } from "@ui/MovePop";

export function EncumbranceReadout({ e }: { e: EncumbranceVM }) {
  const tier = encTierClass(e.tier);
  return (
    <span className={cx("osc-enc-readout", tier)}>
      {/* only the rates trigger the popover (not the Load number). tabIndex makes
          the trigger keyboard-reachable; MoveTooltip anchors to its parent, so it
          must stay a direct child of this span. */}
      <span
        className="rates"
        tabIndex={0}
        aria-label={`Movement: ${moveRatesLabel(e.moveBands)}${e.status ? `. ${e.status}` : ""}`}
      >
        <MoveRates bands={e.moveBands} />
        <MoveTooltip bands={e.moveBands} tier={e.tier} status={e.status} />
      </span>
      <i className="fa fa-dot u-text-faint" />
      {e.label && <span className="load u-text-faint">{e.label}</span>}
    </span>
  );
}
