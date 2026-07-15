import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "./cx";

/** Dot-meter: `total` dots, the first `filled` of them marked `.filled`. Fully
 *  vellum-styled (see `.pips`/`.pip` in components.css) — no per-call-site CSS.
 *  `size="sm"` shrinks the dots (cast rows); `hollow` switches to the bordered
 *  slot-pip ring that can hold a `glyph` inside its filled dots (level heads).
 *  Spread aria/HTML attrs onto the wrapper (role, aria-label, aria-hidden).
 *  Pass `onPipClick` to make each dot a button (e.g. inventory tick-off). */
export function Pips({
  total,
  filled,
  size,
  hollow,
  className,
  glyph,
  ref,
  onPipClick,
  pipLabel,
  pipDisabled,
  ...rest
}: {
  total: number;
  filled: number;
  /** dot size — default (md, 16px) or "sm" (9px) */
  size?: "sm";
  /** bordered ring style (transparent empty) that holds `glyph`; default = solid disc */
  hollow?: boolean;
  className?: string;
  /** rendered inside FILLED dots only (hollow variant) */
  glyph?: ReactNode;
  /** wrapper ref (e.g. to measure overflow) */
  ref?: Ref<HTMLSpanElement>;
  /** when set, each dot renders as a button that calls this with its index */
  onPipClick?: (index: number) => void;
  /** per-dot aria-label for the interactive variant */
  pipLabel?: (index: number) => string;
  /** disables every interactive dot */
  pipDisabled?: boolean;
} & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      ref={ref}
      className={cx("pips", size, hollow && "hollow", className)}
      {...rest}
    >
      {Array.from({ length: total }).map((_, i) => {
        const isFilled = i < filled;
        const content = isFilled ? glyph : null;
        return onPipClick ? (
          <button
            key={i}
            type="button"
            className={cx("pip", isFilled && "filled")}
            aria-label={pipLabel?.(i)}
            disabled={pipDisabled}
            onClick={() => onPipClick(i)}
          >
            {content}
          </button>
        ) : (
          <span
            key={i}
            className={cx("pip", isFilled && "filled")}
            aria-hidden="true"
          >
            {content}
          </span>
        );
      })}
    </span>
  );
}
