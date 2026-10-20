import { cx } from "./cx";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "danger" | "ghost";
  /** Color tone for the outline variant (no effect without variant="outline").
   *  Names match the Vellum color vocabulary. Default is the plain outline accent. */
  tone?: "accent" | "brass" | "danger" | "success" | "warn";
  size?: "sm" | "xs";
};

const VARIANT_CLASS = {
  primary: "vm-btn-primary vm-btn-sm",
  danger: "vm-btn-danger vm-btn-sm",
  outline: "vm-btn-secondary",
  ghost: "vm-btn-secondary",
} as const;

/** @category Controls */
export function Button({ variant, tone, size, className, type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      className={cx(
        "vm-btn",
        VARIANT_CLASS[variant ?? "outline"],
        variant === "outline" && tone && `tone-${tone}`,
        size === "xs" && "osc-btn-xs",
        className,
      )}
      {...rest}
    />
  );
}
