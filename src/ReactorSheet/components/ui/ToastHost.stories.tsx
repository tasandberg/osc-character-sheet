import { ToastProvider } from "./ToastHost";
import { useToast } from "./toastContext";
import { Button } from "./Button";

export default { title: "Overlays / ToastHost" };

// ToastHost is a portal host: ToastProvider owns the queue and pins the host to
// the sheet's bottom-right. Fire toasts via useToast() from any descendant.
function Firer() {
  const toast = useToast();
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", minHeight: 220 }}>
      <Button onClick={() => toast({ intent: "success", title: "Save passed", message: "Your saving throw succeeded." })}>
        Success
      </Button>
      <Button variant="danger" onClick={() => toast({ intent: "danger", title: "Save failed", message: "You take full damage." })}>
        Danger
      </Button>
      <Button variant="outline" onClick={() => toast({ intent: "warning", title: "Low on HP", message: "Consider resting." })}>
        Warning
      </Button>
      <Button variant="ghost" onClick={() => toast({ title: "Notice", message: "Something happened.", duration: 0 })}>
        Sticky (no auto-dismiss)
      </Button>
    </div>
  );
}

export const Host = () => (
  <ToastProvider>
    <Firer />
  </ToastProvider>
);
