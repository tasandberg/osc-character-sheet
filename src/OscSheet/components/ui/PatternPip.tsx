import { cx } from "./cx";

export function PatternPip({
  pattern,
  onCycle,
  size,
  label = "Pattern",
}: {
  pattern: string;
  label?: string;
  onCycle?: () => void;
  size?: "md";
}) {
  const className = cx("pattern-pip", size);
  if (!onCycle)
    return (
      <span
        className={className}
        data-pattern={pattern}
        title={`${pattern} pattern`}
      />
    );
  return (
    <button
      type="button"
      className={className}
      data-pattern={pattern}
      aria-label={`${label}: ${pattern}. Click to change`}
      title={`${pattern} pattern`}
      onClick={onCycle}
    />
  );
}
