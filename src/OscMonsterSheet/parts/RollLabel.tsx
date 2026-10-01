import type { MouseEvent, ReactNode } from "react";
import { cx } from "@ui/cx";

export function DieGlyph() {
  return (
    <svg className="osc-monster-die" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" />
      <path d="M12 7l4.5 8h-9z" />
    </svg>
  );
}

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
      {glyph && <DieGlyph />}
    </button>
  );
}
