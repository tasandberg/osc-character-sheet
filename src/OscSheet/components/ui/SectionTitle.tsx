import { cx } from "./cx";
import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLHeadingElement> & {
  hint?: ReactNode;
  /**
   * `sub` — small uppercase sans label for sub-section heads (e.g. inventory
   * "Equipped" / "All Items"). `bare` — keeps the display type but drops the
   * rule + margins, for embedded heads like a modal title.
   */
  variant?: "sub" | "bare";
};

/** @category Layout */
export function SectionTitle({ hint, variant, children, className, ...rest }: Props) {
  return (
    <h3 className={cx("section-title", variant, className)} {...rest}>
      {children}
      {hint != null && <span className="hint">{hint}</span>}
    </h3>
  );
}
