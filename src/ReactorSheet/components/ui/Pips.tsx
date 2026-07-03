import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

/** Dot-meter: `total` dots, the first `filled` of them marked `.filled`. Fully
 *  vellum-styled (see `.pips`/`.pip` in components.css) — no per-call-site CSS.
 *  `size="sm"` shrinks the dots (cast rows); `hollow` switches to the bordered
 *  slot-pip ring that can hold a `glyph` inside its filled dots (level heads).
 *  Spread aria/HTML attrs onto the wrapper (role, aria-label, aria-hidden). */
export function Pips({
  total,
  filled,
  size,
  hollow,
  className,
  glyph,
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
} & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cx("pips", size, hollow && "hollow", className)} {...rest}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={cx("pip", i < filled && "filled")} aria-hidden="true">
          {i < filled ? glyph : null}
        </span>
      ))}
    </span>
  );
}
