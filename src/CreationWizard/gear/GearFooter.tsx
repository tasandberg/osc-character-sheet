import { cx } from "@ui/cx";
import type { CreationRules } from "../rules";
import type { GearDraft } from "./gearDraft";
import type { LoadPreview } from "./gearTypes";
import type { AbilityScores } from "../scores/scoresDraft";
import { useLoadPreview } from "./useLoadPreview";

type Props = {
  draft: GearDraft;
  rules: CreationRules;
  scores: AbilityScores;
};

function Load({ preview }: { preview?: LoadPreview }) {
  if (!preview?.enabled)
    return (
      <>
        <span className="vm-key">Load</span>
        <span className="vm-help">
          {preview ? "Not tracked — encumbrance is off" : "—"}
        </span>
      </>
    );
  const { value, max, pct, label, tier } = preview;
  return (
    <div className={cx("vm-meter", pct >= 1 && "vm-meter-over")}>
      <div className="vm-meter-head">
        <span className="vm-meter-label">Load</span>
        {tier && <span className="vm-meter-value">{tier}</span>}
      </div>
      <div
        className="vm-meter-track"
        role="meter"
        aria-label={`Load ${label}`}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <span
          className="vm-meter-fill"
          style={{ width: `${Math.min(100, pct * 100)}%` }}
        />
      </div>
      <span className="vm-meter-caption">{label}</span>
    </div>
  );
}

export function GearFooter(props: Props) {
  const preview = useLoadPreview(props);
  return (
    <div
      className="osc-creation-gear-footer u-flex u-items-center u-gap-5"
      role="group"
      aria-label="Load and movement"
      aria-live="polite"
    >
      <div className="osc-creation-gear-footer-cell osc-creation-gear-load u-flex tw:flex-col u-gap-1">
        <Load preview={preview} />
      </div>
      <div className="osc-creation-gear-footer-cell u-flex tw:flex-col u-gap-1">
        <span className="vm-key">Movement</span>
        <span className="osc-creation-gear-figure u-fs-3xl">
          {preview ? `${preview.movement.base}′` : "—"}
        </span>
      </div>
    </div>
  );
}
