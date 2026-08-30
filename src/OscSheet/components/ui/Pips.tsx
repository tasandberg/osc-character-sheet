import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "./cx";

/** Dot-meter: `total` dots, the first `filled` of them marked `.filled`. Fully
 *  vellum-styled (see `.pips`/`.pip` in components.css) — no per-call-site CSS.
 *  `size="sm"` shrinks the dots (cast rows); `square` swaps the disc for a small
 *  square (inventory uses); `hollow` switches to the bordered slot-pip ring that
 *  can hold a `glyph` inside its filled dots (level heads). Spread aria/HTML attrs
 *  onto the wrapper (role, aria-label, aria-hidden). With `onSetFilled` the dots
 *  become buttons: clicking dot i asks for `i` filled when it's lit (spend it and
 *  everything right of it) or `i + 1` when it's dark (restore through it). */
export function Pips({
  total,
  filled,
  size,
  square,
  hollow,
  className,
  glyph,
  ref,
  onSetFilled,
  ...rest
}: {
  total: number;
  filled: number;
  /** dot size — default (md, 16px) or "sm" (9px) */
  size?: "sm";
  /** square dots instead of the default circle */
  square?: boolean;
  /** bordered ring style (transparent empty) that holds `glyph`; default = solid disc */
  hollow?: boolean;
  className?: string;
  /** rendered inside FILLED dots only (hollow variant) */
  glyph?: ReactNode;
  /** wrapper ref (e.g. to measure overflow) */
  ref?: Ref<HTMLSpanElement>;
  /** makes the dots clickable: called with the new filled count */
  onSetFilled?: (next: number) => void;
} & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      ref={ref}
      className={cx(
        "pips",
        size,
        square && "square",
        hollow && "hollow",
        className,
      )}
      {...rest}
    >
      {Array.from({ length: total }).map((_, i) => {
        const lit = i < filled;
        if (!onSetFilled) {
          return (
            <span
              key={i}
              className={cx("pip", lit && "filled")}
              aria-hidden="true"
            >
              {lit ? glyph : null}
            </span>
          );
        }
        const next = lit ? i : i + 1;
        return (
          <button
            key={i}
            type="button"
            className={cx("pip", lit && "filled")}
            aria-label={`Set ${next} of ${total} remaining`}
            onClick={() => onSetFilled(next)}
          >
            {lit ? glyph : null}
          </button>
        );
      })}
    </span>
  );
}
