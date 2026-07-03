import { cx } from "./cx";

type Props = {
  value: number;
  max: number;
  /** token color var name for the fill, default --teal */
  color?: string;
  className?: string;
};

/** @category Display */
export function ProgressBar({ value, max, color = "var(--teal)", className }: Props) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      className={cx("progress", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      style={{ background: "var(--surface-3)", borderRadius: "var(--r-sm)", overflow: "hidden", height: 8 }}
    >
      <div style={{ width: `${pct}%`, height: "100%", background: color }} />
    </div>
  );
}
