// Encumbrance readout for the Inventory header: the three OSE movement rates,
// tinted by encumbrance tier. Hover reveals the tier name (same tint) + the load
// breakdown — the header MOVE tile's hover tells the same story from the other end.
import type { EncumbranceVM } from "@domain/vm-types";
import { encTierClass, moveRatesLabel } from "@domain/format";
import { cx } from "@ui/cx";
import { MoveRates, PopRow, StatPop } from "@ui/MovePop";

export function EncumbranceReadout({ e }: { e: EncumbranceVM }) {
  const tier = encTierClass(e.tier);
  return (
    <span
      className={cx("osc-enc-readout", tier)}
      // focusable so the hover-only popover is reachable by keyboard (:focus-within)
      tabIndex={0}
      aria-label={`${e.status}. Movement: ${moveRatesLabel(e.moveBands)}`}
    >
      <MoveRates bands={e.moveBands} />
      <StatPop>
        <PopRow k="Encumbrance" v={e.status} vClass={tier} />
        {e.label && <PopRow k="Load" v={e.label} />}
      </StatPop>
    </span>
  );
}
