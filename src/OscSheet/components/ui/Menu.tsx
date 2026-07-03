import { cx } from "./cx";
import type { HTMLAttributes, ReactNode } from "react";

// React 19's HTMLAttributes already declares the native `popover` attribute as a
// string union; omit it so our boolean `popover` modifier doesn't collapse to `never`.
/** @category Overlays */
export function Menu({ popover, open, className, ...rest }: Omit<HTMLAttributes<HTMLDivElement>, "popover"> & { popover?: boolean; open?: boolean }) {
  return <div className={cx("menu", popover && "is-popover", open && "is-open", className)} {...rest} />;
}
export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="menu-label">{children}</div>;
}
export function MenuSep() {
  return <div className="menu-sep" />;
}
export function MenuItem({
  icon,
  shortcut,
  danger,
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { icon?: ReactNode; shortcut?: ReactNode; danger?: boolean }) {
  return (
    <div className={cx("menu-item", danger && "danger", className)} role="menuitem" {...rest}>
      {icon != null && <span className="ic">{icon}</span>}
      {children}
      {shortcut != null && <span className="shortcut">{shortcut}</span>}
    </div>
  );
}
