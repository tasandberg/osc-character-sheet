import type { ReactNode } from "react";
import { cx } from "./cx";

export function LeaderRow({
  label,
  children,
  valueClassName,
}: {
  label: ReactNode;
  children: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="leader-row u-flex u-items-baseline u-gap-1">
      {label}
      <span className="leader-row-fill" aria-hidden="true" />
      <span className={cx("leader-row-value", valueClassName)}>{children}</span>
    </div>
  );
}
