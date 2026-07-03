import { cx } from "./cx";

type Option<T extends string> = { value: T; label: string };
type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onValueChange: (next: T) => void;
  className?: string;
};

/** @category Controls */
export function Segmented<T extends string>({ options, value, onValueChange, className }: Props<T>) {
  return (
    <div className={cx("segmented", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={cx(o.value === value && "on")}
          onClick={() => onValueChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
