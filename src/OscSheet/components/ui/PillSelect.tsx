import { cx } from "./cx";
import type { ReactNode } from "react";

type PillOption<T extends string | number> = {
  value: T;
  label: ReactNode;
  /** Optional trailing count, rendered as a dim "(n)". */
  count?: number;
};

type Props<T extends string | number> = {
  options: PillOption<T>[];
  value: T;
  onValueChange: (next: T) => void;
  /** Group label for assistive tech. */
  ariaLabel?: string;
  className?: string;
};

/**
 * A wrapping row of discrete selectable pills (single-select), each with an
 * optional trailing count — e.g. spell-level tabs "Lv 1 (3)". Unlike the
 * connected `Segmented` control, pills are separate, wrap to multiple rows, and
 * the active pill takes a brass outline.
 *
 * @category Controls
 */
export function PillSelect<T extends string | number>({
  options,
  value,
  onValueChange,
  ariaLabel,
  className,
}: Props<T>) {
  return (
    <div className={cx("pill-select", className)} role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className={cx("pill", o.value === value && "on")}
          aria-pressed={o.value === value}
          onClick={() => onValueChange(o.value)}
        >
          {o.label}
          {o.count != null && <span className="ct">({o.count})</span>}
        </button>
      ))}
    </div>
  );
}
