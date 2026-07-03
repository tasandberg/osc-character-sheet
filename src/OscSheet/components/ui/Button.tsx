import { cx } from "./cx";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "danger" | "ghost";
  size?: "sm";
};

/** @category Controls */
export function Button({ variant, size, className, type = "button", ...rest }: Props) {
  return <button type={type} className={cx("btn", variant, size, className)} {...rest} />;
}
