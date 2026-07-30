// Sort header row (uses the shared SortHeader).
import type { InventorySortKey } from "@domain/vm-types";
import { SortHeader } from "@features/inventory/SortHeader";
import { loadHeading } from "@features/inventory/groups";
import type { SortState } from "@features/inventory/types";

export function SortHeaderRow({
  sort,
  variant,
  onSort,
}: {
  sort: SortState;
  /** Active encumbrance variant — the load column is "Slots" under item-based. */
  variant?: string;
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
      {th("weight", loadHeading(variant).column, "osc-inv-th-wt")}
      <span className="osc-inv-thlabel osc-inv-thlabel-eq">Equip</span>
    </div>
  );
}
