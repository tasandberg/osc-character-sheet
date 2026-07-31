type Props = { label: string; hint?: string };

/** Labeled dashed box marking a layout region built in a later phase. */
export function Placeholder({ label, hint }: Props) {
  return (
    <div className="osc-placeholder" role="presentation">
      <span className="osc-ph-label tw:font-sans tw:text-[length:var(--fs-sm)] tw:font-semibold tw:tracking-[0.02em]">
        {label}
      </span>
      {hint && (
        <span className="osc-ph-hint tw:text-[length:var(--fs-3xs)] tw:text-text-faint">{hint}</span>
      )}
    </div>
  );
}
