import { cx } from "./cx";
import type { ButtonHTMLAttributes } from "react";

/** @category Controls — transparent inline action button. Owns the look
 *  (teal → brass hover, branded focus ring); the consumer supplies content
 *  (icon and/or text) and any positioning via className. */
export function InlineButton({ className, type = "button", ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={cx("inline-btn", className)} {...rest} />;
}
