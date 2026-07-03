import { cx } from "./cx";
import { SectionTitle } from "./SectionTitle";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/** @category Overlays */
export function Modal({ open, title, onClose, children, footer, className }: Props) {
  if (!open) return null;
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className={cx("modal", className)} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <SectionTitle variant="bare" className="ttl">{title}</SectionTitle>
          <button type="button" className="x" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer != null && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
