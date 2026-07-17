import type { ReactNode } from "react";
import type { SortDir } from "@domain/vm-types";
import { cx } from "@ui/cx";

/** A sortable column header button (caret + aria-sort). Key-agnostic so both the
 *  items table and the wealth coin table drive it from their own sort state. */
export function SortHeader({
  label,
  className,
  active,
  dir,
  onClick,
}: {
  label: ReactNode;
  className?: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  // A click bakes this order into the manual baseline; clicking the active header
  // again flips direction. Drags then override.
  const title = active ? "Sorted — click to reverse" : "Click to sort — then drag to fine-tune";
  return (
    <button
      type="button"
      className={cx("osc-inv-th", className, active && "active")}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      title={title}
      onClick={onClick}
    >
      {/* Caret sits to the LEFT of the label (shared by the items + wealth tables)
          so it never crowds the next column on a right-aligned header. */}
      <i
        className={cx(
          "osc-inv-th-caret",
          "fa-solid",
          active && (dir === "asc" ? "fa-caret-up" : "fa-caret-down"),
        )}
        aria-hidden="true"
      />
      {label}
    </button>
  );
}
