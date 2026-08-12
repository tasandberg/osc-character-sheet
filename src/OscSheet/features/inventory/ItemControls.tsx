import { useLayoutEffect, useRef } from "react";
import { useOscSheetContext } from "@app/context";
import { fireInventoryItemControls } from "@domain/extensions";

/**
 * Extension point for module-supplied item controls (OSC-185).
 *
 * React only reconciles children it rendered, so a host element it renders EMPTY
 * is a safe place for a module to append into — nothing here is ever diffed away.
 * The sheet clears it before each fire so a re-render can't stack duplicates.
 */
export function ItemControls({ itemId }: { itemId: string }) {
  const { actor, items, app } = useOscSheetContext();
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const controlsElement = ref.current;
    const item = items.find((i) => i._id === itemId);
    if (!controlsElement || !item) return;
    controlsElement.replaceChildren();
    fireInventoryItemControls({
      sheet: app,
      actor,
      item,
      rowElement: controlsElement.closest(".osc-inv-row"),
      controlsElement,
    });
    return () => controlsElement.replaceChildren();
  });

  return <span className="osc-inv-controls" ref={ref} />;
}
