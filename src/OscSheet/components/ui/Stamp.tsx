import { cx } from "./cx";
import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement> & { size?: "sm" | "md" | "lg" };

/** @category Display */
export function Stamp({ size = "sm", className, ...rest }: Props) {
  return <span className={cx("stamp", size, className)} {...rest} />;
}
