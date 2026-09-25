import { cx } from "./cx";
import type { ButtonHTMLAttributes } from "react";
import { FONT_SIZE_CLASSES, type FontSize } from "./fontSizes";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "link";
  size?: FontSize;
};

/** @category Controls — transparent inline action button. Owns the look
 *  (teal → brass hover, branded focus ring); the consumer supplies content
 *  (icon and/or text) and any positioning via className. */
export function InlineButton({
  variant,
  size,
  className,
  type = "button",
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={cx(
        "inline-btn",
        variant,
        size && FONT_SIZE_CLASSES[size],
        className,
      )}
      {...rest}
    >
      {variant === "link" ? (
        <span className="inline-btn-label">{children}</span>
      ) : (
        children
      )}
    </button>
  );
}
