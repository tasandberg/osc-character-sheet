import type { MouseEvent } from "react";
import { cx } from "./cx";

export function PatternPip({
  pattern,
  onSelect,
  size,
  shape,
  label = "Pattern",
}: {
  pattern: string;
  label?: string;
  onSelect?: (event: MouseEvent<HTMLButtonElement>) => void;
  size?: "md";
  shape?: "triangle";
}) {
  const className = cx("pattern-pip", size, shape);
  const glyph = shape === "triangle" ? "▶" : null;
  if (!onSelect)
    return (
      <span
        className={className}
        data-pattern={pattern}
        title={`${pattern} pattern`}
      >
        {glyph}
      </span>
    );
  return (
    <button
      type="button"
      className={className}
      data-pattern={pattern}
      aria-label={`${label}: ${pattern}`}
      aria-haspopup="menu"
      title={`${pattern} pattern`}
      onClick={onSelect}
    >
      {glyph}
    </button>
  );
}
