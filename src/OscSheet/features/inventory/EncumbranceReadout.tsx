// Encumbrance readout for the Inventory header: load · status, the band colour
// (green/yellow/red) on the status carrying the signal. The three movement rates are a
// separate centred row below the header rule — see MovementBands / index.tsx.
import type { EncumbranceVM } from "@domain/vm-types";
import { cx } from "@ui/cx";

const ENC_BAND = ["ok", "warn", "danger", "danger", "danger"] as const;
const bandClass = (tier: number) => ENC_BAND[tier] ?? "danger";

export function EncumbranceReadout({ e }: { e: EncumbranceVM }) {
  return (
    <span className={cx("osc-enc-readout", bandClass(e.tier))}>
      {e.label && (
        <>
          <span className="load">{e.label}</span>
          <span className="sep" aria-hidden="true">·</span>
        </>
      )}
      <span className="status">{e.status}</span>
    </span>
  );
}

/** The three OSE movement rates, centred beneath the encumbrance rule. */
export function MovementBands({ e }: { e: EncumbranceVM }) {
  const m = e.moveBands;
  return (
    <div className={cx("osc-inv-moves", bandClass(e.tier))}>
      <span className="band">
        <span className="k">Encounter</span>
        <span className="vv">{m.encounter}′</span>
      </span>
      <span className="band">
        <span className="k">Explore</span>
        <span className="vv">{m.explore}′</span>
      </span>
      <span className="band">
        <span className="k">Travel</span>
        <span className="vv">{m.travel} mi</span>
      </span>
    </div>
  );
}
