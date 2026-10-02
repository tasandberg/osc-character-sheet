import type { HTMLAttributes } from "react";
import { cx } from "./cx";

export function DividedRow({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("divided-row", className)} {...rest} />;
}
