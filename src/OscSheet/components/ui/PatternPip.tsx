import { cx } from "./cx";

export function PatternPip({
  pattern,
  onCycle,
  size,
  shape,
  label = "Pattern",
}: {
  pattern: string;
  label?: string;
  onCycle?: () => void;
  size?: "md";
  shape?: "triangle";
}) {
  const className = cx("pattern-pip", size, shape);
  const glyph = shape === "triangle" ? "▶" : null;
  if (!onCycle)
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
      aria-label={`${label}: ${pattern}. Click to change`}
      title={`${pattern} pattern`}
      onClick={onCycle}
    >
      {glyph}
    </button>
  );
}
