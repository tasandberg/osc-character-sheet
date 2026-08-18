// Sort header row (uses the shared SortHeader).
import type { InventorySortKey } from "@domain/vm-types";
import { SortHeader } from "@features/inventory/SortHeader";
import { INV_HEADROW, MICRO_LABEL } from "@features/inventory/rows/classes";
import type { SortState } from "@features/inventory/types";
import { INV_COLUMNS } from "./columns";
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
  const cells: React.ReactNode[] = [];
  let skip = 0;
  for (const col of INV_COLUMNS) {
    if (skip > 0) {
      skip -= 1;
      continue;
    }
    const span = col.headerSpan ?? 1;
    if (span > 1) skip = span - 1;
    const style = span > 1 ? { gridColumn: `span ${span}` } : undefined;
    const label = col.header?.({ variant });
    const sortKey = col.sort;
    if (label == null) {
      cells.push(<span key={col.key} style={style} aria-hidden="true" />);
    } else if (sortKey) {
      cells.push(
        <SortHeader
          key={col.key}
          label={label}
          className={col.headerClass}
          style={style}
          active={sort.key === sortKey}
          dir={sort.dir}
          onClick={() => onSort(sortKey)}
        />,
      );
    } else {
      cells.push(
        <span
          key={col.key}
          style={style}
          className={cx(
            "osc-inv-thlabel",
            MICRO_LABEL,
            "tw:text-text-faint tw:text-center",
            col.headerClass,
          )}
        >
          {label}
        </span>,
      );
    }
  }
  return (
    <div className={INV_HEADROW} role="row">
      {cells}
    </div>
  );
}
