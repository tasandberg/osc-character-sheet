import type { MouseEvent, ReactNode } from "react";
import { cx } from "@ui/cx";

type Props = {
  children: ReactNode;
  onRoll?: (event: MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  className?: string;
  glyph?: boolean;
};

export function RollLabel({
  children,
  onRoll,
  title,
  className,
  glyph = true,
}: Props) {
  if (!onRoll)
    return (
      <span className={cx("osc-monster-label", className)}>{children}</span>
    );
  return (
    <button
      type="button"
      className={cx("osc-monster-label osc-monster-roll", className)}
      title={title}
      onClick={onRoll}
    >
      {children}
      {glyph && (
        <i
          className="fa-solid fa-dice-d20 osc-monster-die"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
