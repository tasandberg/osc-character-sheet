import { cx } from "./cx";
import type { TextareaHTMLAttributes } from "react";

/** @category Controls */
export function Textarea({ invalid, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea className={cx("textarea", invalid && "is-error", className)} {...rest} />;
}
