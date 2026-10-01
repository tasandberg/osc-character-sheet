import type { ReactNode } from "react";

export function LeaderRow({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="osc-monster-leader-row u-flex u-items-baseline u-gap-1">
      {label}
      <span className="osc-monster-leader-fill" aria-hidden="true" />
      <span className="osc-monster-value u-fs-xs">{children}</span>
    </div>
  );
}
