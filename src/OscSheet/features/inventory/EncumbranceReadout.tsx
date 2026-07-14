// Encumbrance readout for the Inventory header: load · status · move, with the
// band colour (green/yellow/red) on status+move carrying the signal — no bar.
import type { EncumbranceVM } from "@domain/vm-types";
import { cx } from "@ui/cx";

const ENC_BAND = ["ok", "warn", "danger", "danger", "danger"] as const;

export function EncumbranceReadout({ e }: { e: EncumbranceVM }) {
  return (
    <span className={cx("osc-enc-readout", ENC_BAND[e.tier])}>
      {e.label && (
        <>
          <span className="load">{e.label}</span>
          <span className="sep" aria-hidden="true">·</span>
        </>
      )}
      <span className="status">{e.status}</span>
      <span className="sep" aria-hidden="true">·</span>
      <span className="move">{e.move}′</span>
    </span>
  );
}
