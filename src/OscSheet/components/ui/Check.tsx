import { cx } from "./cx";
import type { InputHTMLAttributes, ReactNode } from "react";

/** @category Controls */
export function Check({ children, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { children?: ReactNode }) {
  return (
    <label className={cx("check", className)}>
      <input type="checkbox" {...rest} />
      <span className="box" />
      {children}
    </label>
  );
}
