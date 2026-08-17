import type { ReactNode } from "react";
import type { SortDir } from "@domain/vm-types";
import { MICRO_LABEL } from "@features/inventory/rows/classes";
import { cx } from "@ui/cx";

/** A sortable column header button (caret + aria-sort). Key-agnostic so both the
 *  items table and the wealth coin table drive it from their own sort state. */
export function SortHeader({
  label,
  className,
  active,
  dir,
  onClick,
  style,
}: {
  label: ReactNode;
  className?: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  // A click bakes this order into the manual baseline; clicking the active header
  // again flips direction. Drags then override.
  const title = active
    ? "Sorted — click to reverse"
    : "Click to sort — then drag to fine-tune";
  return (
    <button
      type="button"
      style={style}
      className={cx(
        "osc-inv-th",
        "tw:inline-flex tw:items-center tw:gap-1 tw:min-w-0 tw:bg-transparent tw:cursor-pointer",
        MICRO_LABEL,
        "tw:transition-[color] tw:duration-120ms",
        // active wins over hover, as the old `&.active` after `&:hover` did —
        // as utilities the hover variant would sort last and take an active
        // header back to the dim colour on hover, so the two are exclusive.
        active
          ? "active tw:text-text"
          : "tw:text-text-faint tw:hover:text-text-dim",
        className,
      )}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      title={title}
      onClick={onClick}
    >
      {/* Caret sits to the LEFT of the label (shared by the items + wealth tables)
          so it never crowds the next column on a right-aligned header. */}
      <i
        className={cx(
          "osc-inv-th-caret",
          // 0.8em tracks the --fs-3xs header so it scales with the font setting
          "tw:text-[0.8em] tw:w-[6px]",
          "fa-solid",
          active && (dir === "asc" ? "fa-caret-up" : "fa-caret-down"),
        )}
        aria-hidden="true"
      />
      {label}
    </button>
  );
}
