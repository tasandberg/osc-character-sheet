import { cx } from "./cx";
import type { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  title: ReactNode;
  message?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/** @category Overlays */
export function Empty({ icon, title, message, action, className }: Props) {
  return (
    <div className={cx("empty", className)}>
      {icon != null && <span className="icn">{icon}</span>}
      <div className="ttl">{title}</div>
      {message != null && <div className="msg">{message}</div>}
      {action}
    </div>
  );
}
