import { cx } from "./cx";
import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement> & {
  /** Black-filled ink block instead of plain key text. */
  ink?: boolean;
};

/** @category Display */
export function Stamp({ ink, className, ...rest }: Props) {
  return <span className={cx("stamp", ink && "ink", className)} {...rest} />;
}
