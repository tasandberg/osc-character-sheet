import type { OscSheetAppProps } from "@domain/types";
import "./styles/vellum/fonts.css";
import "@old-school-chronicle/vellum/tokens.css";
import "./styles/vellum/sheet-base.scss";
import "./styles/vellum/utilities.scss";
import "./styles/vellum/components.css";
import "./styles/styles.scss";
import "./styles/edit-modal.scss";
// Tailwind entry — prefixed, scoped, no preflight. LAST on purpose: its
// utilities are unlayered (tailwind.css explains why), so source order is what
// keeps them above our own stylesheets.
import "./styles/vellum/tailwind.css";
import OscSheetProvider from "@app/OscSheetProvider";
import { useOscSheetContext } from "@app/context";
import { OptimisticProvider } from "@app/OptimisticProvider";
import { SheetErrorBoundary, CrashTestProbe } from "@app/ErrorBoundary";
import SheetShell from "@app/SheetShell";
import LimitedSheet from "@app/LimitedSheet";
import { ToastProvider } from "@ui/ToastHost";
import { useEffect, useRef, type ReactNode } from "react";

/** App root element. Theme is owned by the window (osc-sheet.js `_onRender`
 *  sets data-theme on this.element from the client setting), so this only stops
 *  mousedown bubbling into Foundry.
 *
 *  Sits INSIDE OscSheetProvider and reads `canEdit` from context, not from a
 *  prop: props reach React only at mount, so a mount-time prop would freeze
 *  `.is-readonly` while the provider's gate re-derived — leaving the sheet
 *  functionally editable but still styled read-only after a mid-session grant. */
function ThemedRoot({ children }: { children: ReactNode }) {
  const { canEdit, canViewFullSheet } = useOscSheetContext();
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
      className={`osc-sheet-app${canEdit ? "" : " is-readonly"}${canViewFullSheet ? "" : " is-limited"}`}
      ref={appRef}
    >
      {children}
    </div>
  );
}

function SheetBody() {
  const { canViewFullSheet } = useOscSheetContext();
  return canViewFullSheet ? <SheetShell /> : <LimitedSheet />;
}

function OscSheetApp({
  actor,
  source,
  contextConnector,
  isEditable,
  canViewFullSheet,
}: OscSheetAppProps) {
  // Seeds the provider's gate; it re-derives from every published context after.
  // Falls back to ownership when mounted outside a Foundry sheet (tests).
  const canEdit = isEditable ?? actor?.isOwner ?? false;
  const canViewFull = canViewFullSheet ?? false;
  return (
    <SheetErrorBoundary actor={actor}>
      <OscSheetProvider
        initialActor={actor!}
        source={source!}
        contextConnector={contextConnector}
        canEdit={canEdit}
        canViewFullSheet={canViewFull}
      >
        <ThemedRoot>
          <ToastProvider>
            <OptimisticProvider>
              <SheetBody />
              <CrashTestProbe />
            </OptimisticProvider>
          </ToastProvider>
        </ThemedRoot>
      </OscSheetProvider>
    </SheetErrorBoundary>
  );
}

export default OscSheetApp;
