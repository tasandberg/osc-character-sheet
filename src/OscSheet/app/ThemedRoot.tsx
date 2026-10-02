import { useEffect, useRef, type ReactNode } from "react";
import { useOscSheetContext } from "@app/context";
import { cx } from "@ui/cx";

/** App root element. Theme is owned by the window (osc-sheet.js `_onRender`
 *  sets data-theme on this.element from the client setting), so this only stops
 *  mousedown bubbling into Foundry.
 *
 *  Sits INSIDE OscSheetProvider and reads `canEdit` from context, not from a
 *  prop: props reach React only at mount, so a mount-time prop would freeze
 *  `.is-readonly` while the provider's gate re-derived — leaving the sheet
 *  functionally editable but still styled read-only after a mid-session grant. */
export function ThemedRoot({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
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
      className={cx(
        "osc-sheet-app",
        !canEdit && "is-readonly",
        !canViewFullSheet && "is-limited",
        className,
      )}
      ref={appRef}
    >
      {children}
    </div>
  );
}
