import type { OSEActor, OseItem } from "@domain/types";

/** Fired once per inventory row, after its controls host is in the DOM. */
export const INVENTORY_ITEM_CONTROLS =
  "osc-character-sheet.renderInventoryItemControls";

export interface InventoryItemControlsContext {
  /** The OscSheet ApplicationV2 instance. */
  sheet: unknown;
  actor: OSEActor;
  item: OseItem;
  rowElement: HTMLElement | null;
  /** Empty element the listener owns. Cleared by the sheet before every re-fire. */
  controlsElement: HTMLElement;
}

type HookRegistry = {
  events?: Record<string, unknown[] | undefined>;
  callAll?: (hook: string, ...args: unknown[]) => void;
};

const hooks = (): HookRegistry | undefined =>
  (globalThis as { Hooks?: HookRegistry }).Hooks;

/** Whether any module listens for row controls — the sheet renders no host slot
 *  (and no extra grid track) until one does. */
export function hasInventoryItemControls(): boolean {
  return (hooks()?.events?.[INVENTORY_ITEM_CONTROLS]?.length ?? 0) > 0;
}

export function fireInventoryItemControls(
  context: InventoryItemControlsContext,
): void {
  hooks()?.callAll?.(INVENTORY_ITEM_CONTROLS, context);
}
