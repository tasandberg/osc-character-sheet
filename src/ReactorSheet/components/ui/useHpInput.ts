import type { KeyboardEvent, FocusEvent } from "react";

/** Shared HP-input logic for the HeaderBand and Minibar current-HP fields:
 *  parse, NaN-guard, clamp to [0, max], Enter-to-blur, and ±1 steppers. Markup
 *  differs between the two call sites (inline steppers vs grid-stacked hover
 *  slots), so this is a hook, not a component — each caller keeps its own JSX,
 *  className, and aria-label and spreads `inputProps` onto its `<input>`.
 *
 *  `key` is returned separately (not inside `inputProps`) so callers apply it as
 *  `<input key={key} {...inputProps} />`: React 19 warns when a `key` is spread
 *  in from a props object, and the key is what remounts the input to re-apply
 *  `defaultValue` when the committed value changes externally. */
export function useHpInput({
  value,
  max,
  onSet,
}: {
  value: number;
  max: number;
  onSet: (n: number) => void;
}) {
  const clamp = (n: number) => Math.max(0, Math.min(max, n));
  return {
    /** remount key — apply directly: `<input key={key} {...inputProps} />` */
    key: value,
    inputProps: {
      type: "number" as const,
      inputMode: "numeric" as const,
      min: 0,
      max,
      defaultValue: value,
      onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") e.currentTarget.blur();
      },
      onBlur: (e: FocusEvent<HTMLInputElement>) => {
        const n = parseInt(e.currentTarget.value, 10);
        if (Number.isNaN(n)) {
          e.currentTarget.value = String(value);
          return;
        }
        onSet(clamp(n));
      },
    },
    dec: () => onSet(clamp(value - 1)),
    inc: () => onSet(clamp(value + 1)),
  };
}
