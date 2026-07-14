// Encumbrance readout for the Inventory header: load · status · the three movement
// bands, with the band colour (green/yellow/red) on status+rates carrying the signal.
import type { EncumbranceVM } from "@domain/vm-types";
import { cx } from "@ui/cx";

const ENC_BAND = ["ok", "warn", "danger", "danger", "danger"] as const;

export function EncumbranceReadout({ e }: { e: EncumbranceVM }) {
  const m = e.moveBands;
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
      <span className="move">
        <span className="k">Encounter</span>
        <span className="vv">{m.encounter}′</span>
        <span className="sep" aria-hidden="true">·</span>
        <span className="k">Explore</span>
        <span className="vv">{m.explore}′</span>
        <span className="sep" aria-hidden="true">·</span>
        <span className="k">Travel</span>
        <span className="vv">{m.travel} mi</span>
      </span>
    </span>
  );
}
