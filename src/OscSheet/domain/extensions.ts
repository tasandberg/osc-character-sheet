import type { OSEActor } from "@domain/types";

/** Fired after every commit that paints the sheet, once listeners exist. */
export const SHEET_RENDER = "osc-character-sheet.renderSheet";

export interface SheetRenderContext {
  /** The OscSheet ApplicationV2 instance. */
  sheet: unknown;
  actor: OSEActor;
  /** `.osc-sheet-app` — query the documented anchors under it. */
  element: HTMLElement;
}

type HookRegistry = {
  events?: Record<string, unknown[] | undefined>;
  callAll?: (hook: string, ...args: unknown[]) => void;
};

const hooks = (): HookRegistry | undefined =>
  (globalThis as { Hooks?: HookRegistry }).Hooks;

/** Whether any module listens. Nothing fires until one does. */
export function hasSheetRenderListeners(): boolean {
  return (hooks()?.events?.[SHEET_RENDER]?.length ?? 0) > 0;
}

export function fireSheetRender(context: SheetRenderContext): void {
  hooks()?.callAll?.(SHEET_RENDER, context);
}
