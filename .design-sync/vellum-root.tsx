// Preview provider for design-sync. The Vellum CSS is scoped under
// `.osc-sheet` (and the element reset + content appearance live on
// `.osc-sheet-app`), so every preview card must mount inside this wrapper
// to be styled — same shell the app and Storybook use. Added via cfg.extraEntries;
// wired as cfg.provider.
import type { ReactNode } from "react";

export function VellumRoot({ children }: { children?: ReactNode }) {
  return (
    <div className="osc-sheet">
      <div className="osc-sheet-app" style={{ padding: 16, borderRadius: 8 }}>
        {children}
      </div>
    </div>
  );
}
