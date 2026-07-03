import { cx } from "./cx";

type Props = {
  value: number;
  onValueChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
};

/** @category Controls */
export function Stepper({ value, onValueChange, min, max, step = 1, className }: Props) {
  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
  return (
    <div className={cx("stepper", className)}>
      <button type="button" aria-label="Decrease" onClick={() => onValueChange(clamp(value - step))}>
        −
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onValueChange(clamp(Number(e.target.value)))}
      />
      <button type="button" aria-label="Increase" onClick={() => onValueChange(clamp(value + step))}>
        +
      </button>
    </div>
  );
}
