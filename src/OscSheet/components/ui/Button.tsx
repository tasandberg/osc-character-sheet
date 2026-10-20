import { cx } from "./cx";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "danger" | "ghost";
  /** Colors only the leading icon; the label stays default ink. */
  iconTone?: "accent" | "brass" | "danger" | "success" | "warn";
  size?: "sm" | "xs";
};

const VARIANT_CLASS = {
  primary: "vm-btn-primary vm-btn-sm",
  danger: "vm-btn-danger vm-btn-sm",
  outline: "vm-btn-secondary",
  ghost: "vm-btn-secondary",
} as const;

/** @category Controls */
export function Button({ variant, iconTone, size, className, type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      className={cx(
        "vm-btn",
        VARIANT_CLASS[variant ?? "outline"],
        iconTone && `icon-tone-${iconTone}`,
        size === "xs" && "osc-btn-xs",
        className,
      )}
      {...rest}
    />
  );
}
