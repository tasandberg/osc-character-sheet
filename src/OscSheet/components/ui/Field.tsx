import { cx } from "./cx";
import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

/** @category Controls */
export function Field({
  label,
  hint,
  error,
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { label?: ReactNode; hint?: ReactNode; error?: ReactNode }) {
  return (
    <div className={cx("field", className)} {...rest}>
      {label != null && <label className="field-label">{label}</label>}
      {children}
      {error != null ? (
        <span className="field-error">{error}</span>
      ) : (
        hint != null && <span className="field-hint">{hint}</span>
      )}
    </div>
  );
}

export function Input({ invalid, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={cx("input", invalid && "is-error", className)} {...rest} />;
}
