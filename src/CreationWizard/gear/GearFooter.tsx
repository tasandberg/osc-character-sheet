import { useEffect, useMemo, useState } from "react";
import { cx } from "@ui/cx";
import type { CreationRules } from "../rules";
import { useCompendiumDetail } from "../useCompendiumDetail";
import { cartLines, type GearDraft } from "./gearDraft";
import type { LoadPreview } from "./gearTypes";

type Props = { draft: GearDraft; rules: CreationRules };

function useLoadPreview({ draft, rules }: Props) {
  const catalog = useCompendiumDetail("gear", rules.loadGearCatalog);
  const [preview, setPreview] = useState<LoadPreview>();
  const { cart } = draft;
  const lines = useMemo(() => cartLines(cart), [cart]);
  useEffect(() => {
    if (catalog.status !== "ready") return;
    let live = true;
    rules.previewLoad(lines, catalog.detail).then(
      (next) => live && setPreview(next),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [lines, catalog, rules]);
  return preview;
}

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
  const { carried, max, tier } = preview;
  const limit = max ?? carried;
  const percent = limit ? Math.min(100, (carried / limit) * 100) : 0;
  return (
    <div className={cx("vm-meter", carried > limit && "vm-meter-over")}>
      <div className="vm-meter-head">
        <span className="vm-meter-label">Load</span>
        {tier && <span className="vm-meter-value">{tier}</span>}
      </div>
      <div
        className="vm-meter-track"
        role="meter"
        aria-label={`Load ${carried} of ${limit} coins`}
        aria-valuenow={carried}
        aria-valuemin={0}
        aria-valuemax={limit}
      >
        <span className="vm-meter-fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="vm-meter-caption">{carried} cn</span>
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
