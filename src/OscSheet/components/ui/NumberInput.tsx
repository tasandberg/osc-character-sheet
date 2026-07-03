import { cx } from "./cx";
import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";

type Props = {
  value: number;
  onCommit: (n: number) => void;
  min?: number;
  max?: number;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "min" | "max" | "type">;

/** @category Controls — integer input that tolerates a transient empty/partial
 *  value while editing. Keeps a local string draft; commits a clamped integer
 *  on blur and on Enter. External value changes resync the draft only when the
 *  field is not focused, so they never fight the user's cursor. */
export function NumberInput({ value, onCommit, min, max, className, onFocus, onBlur, onKeyDown, ...rest }: Props) {
  const [draft, setDraft] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDraft(String(value));
  }, [value]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (Number.isNaN(n)) {
      setDraft(String(value));
      return;
    }
    let c = n;
    if (min != null) c = Math.max(min, c);
    if (max != null) c = Math.min(max, c);
    setDraft(String(c));
    if (c !== value) onCommit(c);
  };

  return (
    <input
      {...rest}
      type="number"
      inputMode="numeric"
      className={cx(className)}
      value={draft}
      min={min}
      max={max}
      onFocus={(e) => {
        focused.current = true;
        onFocus?.(e);
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={(e) => {
        focused.current = false;
        commit();
        onBlur?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        onKeyDown?.(e);
      }}
    />
  );
}
