import { cx } from "./cx";
import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

/** @category Controls */
export function Field({
  label,
  hint,
  error,
  children,
  variant,
  htmlFor,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  htmlFor?: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  variant?: "hairline";
}) {
  return (
    <div className={cx("field", variant, className)} {...rest}>
      {label != null && <label className="field-label" htmlFor={htmlFor}>{label}</label>}
      {children}
      {error != null ? (
        <span className="field-error">{error}</span>
      ) : (
        hint != null && <span className="field-hint">{hint}</span>
      )}
    </div>
  );
}

export function Input({
  invalid,
  variant,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; variant?: "hairline" }) {
  return <input className={cx("input", variant, invalid && "is-error", className)} {...rest} />;
}
