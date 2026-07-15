import type { ToastInput } from "@ui/toastContext";

/** Toast text for a "use one" / consume decrement (pip click, Use link, or the
 *  right-click Consume). Returns null when the quantity didn't actually drop — a
 *  no-op at 0 or an increase — so callers can `if (t) toast({ ...t, icon })`. */
export function consumeToast(
  name: string,
  from: number,
  to: number,
): Pick<ToastInput, "intent" | "title" | "message"> | null {
  if (to >= from) return null;
  const used = from - to;
  return {
    intent: "success",
    title: `Used ${used} ${name}`,
    message: `${to} left`,
  };
}
