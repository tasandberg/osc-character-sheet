import { cx } from "./cx";
import { SectionTitle } from "./SectionTitle";
import type { ReactNode } from "react";

/** @category Layout — a list's title plus column labels, laid on the parent grid's columns. */
export function ColumnHeaderRow({
  title,
  columns,
  className,
}: {
  title: ReactNode;
  columns: ReactNode[];
  className?: string;
}) {
  return (
    <div
      className={cx(
        "tw:col-span-full tw:grid tw:grid-cols-subgrid tw:items-baseline tw:border-b tw:border-(--hairline) u-mb-2",
        className,
      )}
    >
      <SectionTitle variant="bare">{title}</SectionTitle>
      {columns.map((column, index) => (
        <span key={index} className="vm-key tw:pl-3 u-nowrap u-text-dim">
          {column}
        </span>
      ))}
    </div>
  );
}
