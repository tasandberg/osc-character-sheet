// Sort header row (uses the shared SortHeader).
import type { InventorySortKey } from "@domain/vm-types";
import { SortHeader } from "@features/inventory/SortHeader";
import { loadHeading } from "@features/inventory/groups";
import { INV_ROW, MICRO_LABEL } from "@features/inventory/rows/classes";
import type { SortState } from "@features/inventory/types";
import { cx } from "@ui/cx";

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
    <div className={INV_HEADROW} role="row">
      <span aria-hidden="true" /> {/* drag */}
      {/* "Item" spans the image + name columns so it left-aligns to the image */}
      {th("name", "Item", "osc-inv-th-item")}
      {/* right-aligned data columns: shrink the header to the cell edge so the
          label sits over its own column. Type is dropped at xs with the data. */}
      {th(
        "category",
        "Type",
        "osc-inv-th-cat tw:justify-self-start tw:@max-md/app:hidden",
      )}
      {th(
        "weight",
        loadHeading(variant).column,
        "osc-inv-th-wt tw:justify-self-center",
      )}
      <span
        className={cx(
          "osc-inv-thlabel",
          MICRO_LABEL,
          "tw:text-text-faint tw:text-center",
        )}
      >
        Equip
      </span>
    </div>
  );
}
