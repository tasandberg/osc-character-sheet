import { useRef } from "react";
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
  // A click dispatches on the nearest common ancestor of press and release, so a
  // text-selection drag ending outside lands on the scrim. Backdrop dismissal
  // needs BOTH ends on the scrim.
  const onScrim = useRef(false);
  if (!open) return null;
  return (
    <div
      className="modal-scrim"
      onPointerDown={(e) => {
        onScrim.current = e.target === e.currentTarget;
      }}
      onPointerUp={(e) => {
        if (e.target !== e.currentTarget) onScrim.current = false;
      }}
      onClick={() => {
        const dismiss = onScrim.current;
        onScrim.current = false;
        if (dismiss) onClose();
      }}
    >
      <div className={cx("modal", className)}>
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
