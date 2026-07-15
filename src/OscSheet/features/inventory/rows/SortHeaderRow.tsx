// Sort header row (uses the shared SortHeader).
import type { InventorySortKey } from "@domain/vm-types";
import { SortHeader } from "@features/inventory/SortHeader";
import type { SortState } from "@features/inventory/types";

export function SortHeaderRow({
  sort,
  onSort,
}: {
  sort: SortState;
  onSort: (key: InventorySortKey) => void;
}) {
  const th = (
    col: InventorySortKey,
    label: React.ReactNode,
    className?: string,
  ) => (
    <SortHeader
      label={label}
      className={className}
      active={sort.key === col}
      dir={sort.dir}
      onClick={() => onSort(col)}
    />
  );
  return (
    <div className="osc-inv-row osc-inv-headrow" role="row">
      <span aria-hidden="true" /> {/* drag */}
      {/* "Item" spans the image + name columns so it left-aligns to the image */}
      {th("name", "Item", "osc-inv-th-item")}
      {th("category", "Type", "osc-inv-th-cat")}
      {th("weight", "Wt", "osc-inv-th-wt")}
      <span className="osc-inv-thlabel osc-inv-thlabel-eq">Equip</span>
    </div>
  );
}
