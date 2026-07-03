type Props = { label: string; hint?: string };

/** Labeled dashed box marking a chrome region built in a later phase. */
export function Placeholder({ label, hint }: Props) {
  return (
    <div className="osc-placeholder" role="presentation">
      <span className="osc-ph-label">{label}</span>
      {hint && <span className="osc-ph-hint">{hint}</span>}
    </div>
  );
}
