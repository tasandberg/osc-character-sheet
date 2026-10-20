import { cx } from "./cx";
import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement>;

/** @category Display */
export function Stamp({ className, ...rest }: Props) {
  return <span className={cx("stamp", className)} {...rest} />;
}
