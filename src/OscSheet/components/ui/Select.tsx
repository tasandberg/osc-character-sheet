import { cx } from "./cx";
import type { SelectHTMLAttributes } from "react";

/** @category Controls */
export function Select({ invalid, className, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return <select className={cx("select", invalid && "is-error", className)} {...rest} />;
}
