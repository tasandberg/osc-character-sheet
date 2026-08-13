import { useLayoutEffect, type RefObject } from "react";
import { useOscSheetContext } from "@app/context";
import { fireSheetRender, hasSheetRenderListeners } from "@domain/extensions";

/**
 * Tells modules the sheet just painted, so they can re-inject their own DOM.
 *
 * Foundry's `_onRender` misses React's own re-renders, and React reconciles away
 * foreign nodes among children it rendered — so a module's only durable option is
 * to re-apply after every commit. No dependency array on purpose.
 */
export function useExtensionRender(ref: RefObject<HTMLElement | null>): void {
  const { actor, app } = useOscSheetContext();

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !hasSheetRenderListeners()) return;
    fireSheetRender({ sheet: app, actor, element });
  });
}
