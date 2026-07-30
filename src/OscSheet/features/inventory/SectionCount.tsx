// Section header (static — title + "N items · X cn", plus an optional control slot).
import type { ReactNode } from "react";
import type { InventoryItemVM } from "@domain/vm-types";
import { sectionCountLabel } from "@features/inventory/groups";
import { SectionTitle } from "@ui/SectionTitle";

export function SectionCount({
  title,
  items,
  variant,
  controls,
}: {
  title: string;
  items: InventoryItemVM[];
  /** Active encumbrance variant — picks the total's unit (slots vs cn). */
  variant?: string;
  controls?: ReactNode;
}) {
  return (
    <div className="osc-inv-sec-head">
      <SectionTitle variant="sub">{title}</SectionTitle>
      {controls}
      <span className="osc-inv-sec-count">{sectionCountLabel(items, variant)}</span>
    </div>
  );
}
