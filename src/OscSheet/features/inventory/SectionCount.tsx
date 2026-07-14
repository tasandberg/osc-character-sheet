// Section header (static — title + "N items · X cn", plus an optional control slot).
import type { ReactNode } from "react";
import type { InventoryItemVM } from "@domain/vm-types";
import { sectionCountLabel } from "@features/inventory/groups";
import { SectionTitle } from "@ui/SectionTitle";

export function SectionCount({
  title,
  items,
  controls,
}: {
  title: string;
  items: InventoryItemVM[];
  controls?: ReactNode;
}) {
  return (
    <div className="osc-inv-sec-head">
      <SectionTitle variant="sub">{title}</SectionTitle>
      {/* controls sit beside the title; the count keeps the right edge (margin-left: auto) */}
      {controls}
      <span className="osc-inv-sec-count">{sectionCountLabel(items)}</span>
    </div>
  );
}
