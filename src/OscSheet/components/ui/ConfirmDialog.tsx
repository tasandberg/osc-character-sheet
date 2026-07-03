import type { ReactNode } from "react";
import { Button } from "./Button";

/** @category Overlays — DS confirm dialog; supersedes native window.confirm.
 *  Ink-stamp header, sans body at --fs-md, right-aligned Button pair. Render it
 *  inside a position:relative ancestor so the absolute scrim stays in-window. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: ReactNode;
  body: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="ed-confirm-scrim" onClick={onCancel}>
      <div className="ed-confirm" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="ed-confirm-head">{title}</div>
        <div className="ed-confirm-body">{body}</div>
        <div className="ed-confirm-foot">
          <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={variant} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
