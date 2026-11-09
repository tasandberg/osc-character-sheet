import { useEffect, useRef } from "react";
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

const openModals = new Set<HTMLElement>();

function isTopmost(box: HTMLElement): boolean {
  for (const other of openModals)
    if (
      other !== box &&
      other.isConnected &&
      box.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING
    )
      return false;
  return true;
}

/** @category Overlays */
export function Modal({ open, title, onClose, children, footer, className }: Props) {
  // A click dispatches on the nearest common ancestor of press and release, so a
  // text-selection drag ending outside lands on the scrim. Backdrop dismissal
  // needs BOTH ends on the scrim.
  const onScrim = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const box = boxRef.current;
    if (!open || !box) return;
    openModals.add(box);
    if (!box.contains(document.activeElement)) box.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !isTopmost(box)) return;
      const target = event.target;
      if (target !== document.body && !(target instanceof Node && box.contains(target)))
        return;
      event.stopPropagation();
      event.preventDefault();
      closeRef.current();
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      openModals.delete(box);
    };
  }, [open]);

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
      <div className={cx("modal", className)} ref={boxRef} tabIndex={-1}>
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
