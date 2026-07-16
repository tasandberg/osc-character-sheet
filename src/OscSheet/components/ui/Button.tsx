import { cx } from "./cx";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "danger" | "ghost";
  /** Color tone for the outline variant (no effect without variant="outline").
   *  Names match the Vellum color vocabulary. Default is the plain outline accent. */
  tone?: "accent" | "brass" | "danger" | "success" | "warn";
  size?: "sm" | "xs";
};

/** @category Controls */
export function Button({ variant, tone, size, className, type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      className={cx("btn", variant, tone && `tone-${tone}`, size, className)}
      {...rest}
    />
  );
}
