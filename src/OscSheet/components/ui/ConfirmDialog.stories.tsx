import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { Button } from "./Button";

export default { title: "Overlays / ConfirmDialog" };

// ConfirmDialog renders an absolute scrim, so it needs a position:relative
// ancestor to stay in-window. Each demo owns its own open state.
function Demo({ variant }: { variant: "primary" | "danger" }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", minHeight: 160, padding: 12, flex: 1 }}>
      <Button variant={variant} onClick={() => setOpen(true)}>
        {variant === "danger" ? "Delete item" : "Level up"}
      </Button>
      <ConfirmDialog
        open={open}
        variant={variant}
        title={variant === "danger" ? "Delete item?" : "Confirm level up"}
        body={
          variant === "danger"
            ? "This permanently removes the item from the sheet."
            : "Advance to the next level and roll new hit points?"
        }
        confirmLabel={variant === "danger" ? "Delete" : "Level up"}
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}

export const Variants = () => (
  <div style={{ display: "flex", gap: 16 }}>
    <Demo variant="primary" />
    <Demo variant="danger" />
  </div>
);
