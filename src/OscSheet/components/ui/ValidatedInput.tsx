import { useEffect, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

/**
 * Text input that validates its draft on blur (and Enter) via `validate`,
 * committing only when the value is both changed and valid. An invalid entry
 * flags the input (`is-error`) and shows the returned message; otherwise the
 * optional `hint` renders in the message slot.
 *
 * `validate` returns an error message string when invalid, or `null` when valid.
 * @category Controls
 */
export function ValidatedInput({
  value,
  validate,
  onCommit,
  hint,
  className,
  onChange,
  onBlur,
  onKeyDown,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value"> & {
  value: string;
  validate: (v: string) => string | null;
  onCommit: (v: string) => void;
  hint?: ReactNode;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);

  // Re-sync when the committed value changes upstream (reset, dependent edits…).
  useEffect(() => { setDraft(value); setError(null); }, [value]);

  const commit = () => {
    const v = draft.trim();
    if (v === value) return setError(null);
    const err = validate(v);
    if (err) return setError(err);
    setError(null);
    onCommit(v);
  };

  return (
    <>
      <input
        {...rest}
        className={cx(className, error && "is-error")}
        value={draft}
        aria-invalid={error ? true : undefined}
        onChange={(e) => { setDraft(e.target.value); if (error) setError(null); onChange?.(e); }}
        onBlur={(e) => { commit(); onBlur?.(e); }}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); onKeyDown?.(e); }}
      />
      {error != null ? <span className="field-error">{error}</span> : hint}
    </>
  );
}
