import { cx } from "./cx";
import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

/** @category Data */
export function Table({ className, ...rest }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cx("table", className)} {...rest} />;
}
export function Th({ num, className, ...rest }: ThHTMLAttributes<HTMLTableCellElement> & { num?: boolean }) {
  return <th className={cx(num && "num", className)} {...rest} />;
}
export function Td({ num, className, ...rest }: TdHTMLAttributes<HTMLTableCellElement> & { num?: boolean }) {
  return <td className={cx(num && "num", className)} {...rest} />;
}
export function Tr(props: HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props} />;
}
