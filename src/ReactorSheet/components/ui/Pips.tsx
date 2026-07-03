import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

/** Dot-meter: `total` dots, the first `filled` of them marked `.filled`. A thin,
 *  class-agnostic primitive — the contextual class (`sp-dots`/`slots` wrapper,
 *  `sp-dot`/`rs-pip` dot) owns size/colour; the `.pips`/`.pip` base only carries
 *  the shared skeleton (gap, round, filled ink). Optional `glyph` renders inside
 *  filled dots only (e.g. the slot diamond). Spread aria/HTML attrs onto the
 *  wrapper (role, aria-label, aria-hidden). */
export function Pips({
  total,
  filled,
  className,
  dotClassName,
  glyph,
  ...rest
}: {
  total: number;
  filled: number;
  /** wrapper class (e.g. "sp-dots" | "slots") */
  className?: string;
  /** per-dot base class (e.g. "sp-dot" | "rs-pip") */
  dotClassName?: string;
  /** rendered inside FILLED dots only */
  glyph?: ReactNode;
} & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cx("pips", className)} {...rest}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cx("pip", dotClassName, i < filled && "filled")}
          aria-hidden="true"
        >
          {i < filled ? glyph : null}
        </span>
      ))}
    </span>
  );
}
