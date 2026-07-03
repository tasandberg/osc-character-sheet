import { cx } from "./cx";
import type { HTMLAttributes } from "react";

/** @category Layout */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("card", className)} {...rest} />;
}

/** @category Layout */
export function KvCard({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("kv-card", className)} {...rest} />;
}
