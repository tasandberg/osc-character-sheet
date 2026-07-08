import type { OscSheetAppProps } from "@domain/types";
import "./styles/vellum/fonts.css";
import "./styles/vellum/tokens.scss";
import "./styles/vellum/utilities.scss";
import "./styles/vellum/components.css";
import "./styles/styles.scss";
import "./styles/edit-modal.scss";
import OscSheetProvider from "@app/OscSheetProvider";
import { OptimisticProvider } from "@app/OptimisticProvider";
import { SheetErrorBoundary, CrashTestProbe } from "@app/ErrorBoundary";
import SheetShell from "@app/SheetShell";
import { ToastProvider } from "@ui/ToastHost";
import { useEffect, useRef, type ReactNode } from "react";

/** App root element. Theme is owned by the window (osc-sheet.js `_onRender`
 *  sets data-theme on this.element from the client setting), so this only stops
 *  mousedown bubbling into Foundry. */
function ThemedRoot({
  children,
  canEdit,
}: {
  children: ReactNode;
  canEdit: boolean;
}) {
  const appRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = appRef.current;
    if (!el) return;
    // Prevent crazy event propagation in foundry
    const stopPropagation = (event: MouseEvent) => event.stopPropagation();
    el.addEventListener("mousedown", stopPropagation);
    return () => el.removeEventListener("mousedown", stopPropagation);
  }, []);

  // Read-only mode marker for non-owners: a broad CSS hook that rides alongside
  // the per-control React gating below. (No aria-readonly — it's inert on a
  // role-less div; the individual controls carry their own a11y state.)
  return (
    <div
      className={`osc-sheet-app${canEdit ? "" : " is-readonly"}`}
      ref={appRef}
    >
      {children}
    </div>
  );
}

function OscSheetApp({
  actor,
  source,
  contextConnector,
  isEditable,
}: OscSheetAppProps) {
  // Prefer Foundry's authoritative `sheet.isEditable`; fall back to ownership
  // when mounted outside a Foundry sheet (Storybook / tests).
  const canEdit = isEditable ?? actor?.isOwner ?? false;
  return (
    <ThemedRoot canEdit={canEdit}>
      <SheetErrorBoundary actor={actor}>
        <ToastProvider>
          <OscSheetProvider
            initialActor={actor!}
            source={source!}
            contextConnector={contextConnector}
            canEdit={canEdit}
          >
            <OptimisticProvider>
              <SheetShell />
              <CrashTestProbe />
            </OptimisticProvider>
          </OscSheetProvider>
        </ToastProvider>
      </SheetErrorBoundary>
    </ThemedRoot>
  );
}

export default OscSheetApp;
