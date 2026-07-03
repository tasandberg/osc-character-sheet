import { cx } from "./cx";
import type { InputHTMLAttributes, ReactNode } from "react";

/** @category Controls */
export function Toggle({ children, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { children?: ReactNode }) {
  return (
    <label className={cx("toggle", className)}>
      <input type="checkbox" {...rest} />
      <span className="track" />
      {children}
    </label>
  );
}
