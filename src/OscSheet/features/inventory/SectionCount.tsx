// Section header (static — title + "N items · X cn").
import type { InventoryItemVM } from "@domain/vm-types";
import { sectionCountLabel } from "@features/inventory/groups";
import { SectionTitle } from "@ui/SectionTitle";

export function SectionCount({
  title,
  items,
}: {
  title: string;
  items: InventoryItemVM[];
}) {
  return (
    <div className="osc-inv-sec-head">
      <SectionTitle variant="sub">{title}</SectionTitle>
      <span className="osc-inv-sec-count">{sectionCountLabel(items)}</span>
    </div>
  );
}
