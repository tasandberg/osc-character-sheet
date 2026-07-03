// In-sheet toast notifications. ToastProvider holds a queue and renders our
// custom <Toast> components in a host pinned to the sheet's bottom-right; any
// descendant fires one via useToast(). Auto-dismisses after `duration` (ms).
import { useCallback, useRef, useState, type ReactNode } from "react";
import { Toast } from "./Toast";
import { ToastContext, type ToastInput } from "./toastContext";

type ToastItem = ToastInput & { id: number };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (t: ToastInput) => {
      const id = (nextId.current += 1);
      setToasts((cur) => [...cur, { ...t, id }]);
      const ms = t.duration ?? 3500;
      if (ms > 0) window.setTimeout(() => remove(id), ms);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-host" role="status" aria-live="polite">
        {toasts.map((t) => (
          <Toast key={t.id} intent={t.intent} icon={t.icon} title={t.title} message={t.message} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
