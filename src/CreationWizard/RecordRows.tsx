import type { ReactNode } from "react";

export type RecordRow = [label: string, value: ReactNode];

export function RecordRows({
  rows,
  ...props
}: { rows: RecordRow[] } & Omit<
  React.HTMLAttributes<HTMLDListElement>,
  "className"
>) {
  return (
    <dl className="osc-creation-record u-flex tw:flex-col" {...props}>
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="osc-creation-record-row u-flex u-items-baseline u-justify-between u-gap-3 u-fs-sm"
        >
          <dt className="vm-key u-flex-none">{label}</dt>
          <dd className="tw:text-right">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
