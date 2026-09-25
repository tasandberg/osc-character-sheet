import { useEffect, type RefObject } from "react";

export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  { active = true, closeOnBlur = false } = {},
) {
  useEffect(() => {
    const win = ref.current?.ownerDocument.defaultView;
    if (!active || !win) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    win.addEventListener("pointerdown", onPointerDown);
    win.addEventListener("keydown", onKeyDown);
    if (closeOnBlur) win.addEventListener("blur", onClose);
    return () => {
      win.removeEventListener("pointerdown", onPointerDown);
      win.removeEventListener("keydown", onKeyDown);
      win.removeEventListener("blur", onClose);
    };
  }, [ref, onClose, active, closeOnBlur]);
}
