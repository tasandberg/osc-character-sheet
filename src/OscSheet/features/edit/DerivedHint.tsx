import { HoverTip } from "@ui/HoverTip";

export function DerivedHint({
  breakdown,
  className,
}: {
  breakdown?: string;
  className?: string;
}) {
  if (!breakdown) return <span className={className}>from class</span>;
  return (
    <span
      tabIndex={0}
      className={`${className ?? ""} tw:cursor-help tw:underline tw:decoration-(--text-dim) tw:decoration-dotted tw:underline-offset-[2px]`}
    >
      from class
      <HoverTip className="tw:tabular-nums">{breakdown}</HoverTip>
    </span>
  );
}
