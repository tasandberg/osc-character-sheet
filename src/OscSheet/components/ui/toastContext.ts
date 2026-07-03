// Toast context + hook, split from ToastHost.tsx so that component file can
// fast-refresh cleanly (a file mixing a hook export with a component export
// trips react-refresh/only-export-components).
import { createContext, useContext, type ReactNode } from "react";

export type ToastIntent = "success" | "danger" | "warning";
export type ToastInput = {
  intent?: ToastIntent;
  title: ReactNode;
  message?: ReactNode;
  icon?: ReactNode;
  /** ms before auto-dismiss; 0 to keep until manually closed. Default 3500. */
  duration?: number;
};

export const ToastContext = createContext<(t: ToastInput) => void>(() => {});

/** Fire a toast: `const toast = useToast(); toast({ title, message, intent })`. */
export function useToast() {
  return useContext(ToastContext);
}
