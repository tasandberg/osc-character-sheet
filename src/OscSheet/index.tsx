import type { OscSheetAppProps } from "@domain/types";
import "./styles/vellum/fonts.css";
import "./styles/vellum/tokens.css";
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
function ThemedRoot({ children }: { children: ReactNode }) {
  const appRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = appRef.current;
    if (!el) return;
    // Prevent crazy event propagation in foundry
    const stopPropagation = (event: MouseEvent) => event.stopPropagation();
    el.addEventListener("mousedown", stopPropagation);
    return () => el.removeEventListener("mousedown", stopPropagation);
  }, []);

  return (
    <div className="osc-sheet-app" ref={appRef}>
      {children}
    </div>
  );
}

function OscSheetApp({
  actor,
  source,
  contextConnector,
}: OscSheetAppProps) {
  return (
    <ThemedRoot>
      <SheetErrorBoundary actor={actor}>
        <ToastProvider>
          <OscSheetProvider
            initialActor={actor!}
            source={source!}
            contextConnector={contextConnector}
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
