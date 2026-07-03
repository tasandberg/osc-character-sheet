import { cx } from "./cx";
import type { InputHTMLAttributes, ReactNode } from "react";

/** @category Controls */
export function Radio({ children, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { children?: ReactNode }) {
  return (
    <label className={cx("radio", className)}>
      <input type="radio" {...rest} />
      <span className="dot" />
      {children}
    </label>
  );
}
