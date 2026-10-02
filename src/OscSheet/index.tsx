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
import { ThemedRoot } from "@app/ThemedRoot";

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
