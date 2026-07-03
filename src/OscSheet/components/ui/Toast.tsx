import { cx } from "./cx";
import type { ReactNode } from "react";

type Props = {
  intent?: "success" | "danger" | "warning";
  icon?: ReactNode;
  title: ReactNode;
  message?: ReactNode;
  onClose?: () => void;
  className?: string;
};

/** @category Overlays */
export function Toast({ intent, icon, title, message, onClose, className }: Props) {
  return (
    <div className={cx("toast", intent, className)}>
      {icon != null && <div className="ic">{icon}</div>}
      <div className="body">
        <div className="ttl">{title}</div>
        {message != null && <div className="msg">{message}</div>}
      </div>
      {onClose && (
        <button type="button" className="x" aria-label="Dismiss" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
}
