import type { OSEActor, OseItem } from "@domain/types";

/** Fired when an inventory item's context menu opens, so modules can add actions. */
export const ITEM_CONTEXT_MENU =
  "osc-character-sheet.getItemContextMenuEntries";

export interface ItemMenuEntry {
  label: string;
  /** Font Awesome classes, e.g. "fa-solid fa-box-open". */
  icon?: string;
  disabled?: boolean;
  /** Render in the destructive style. */
  danger?: boolean;
  onClick: (item: OseItem, actor: OSEActor) => void;
}

export interface ItemContextMenuHookArgs {
  actor: OSEActor;
  item: OseItem;
  /** False on read-only sheets — gate write actions on it. */
  canEdit: boolean;
  /** Push entries here; order is preserved. */
  entries: ItemMenuEntry[];
}

type HookRegistry = {
  callAll?: (hook: string, ...args: unknown[]) => void;
};

const hooks = (): HookRegistry | undefined =>
  (globalThis as { Hooks?: HookRegistry }).Hooks;

const isEntry = (entry: unknown): entry is ItemMenuEntry =>
  typeof entry === "object" &&
  entry !== null &&
  typeof (entry as ItemMenuEntry).label === "string" &&
  typeof (entry as ItemMenuEntry).onClick === "function";

export function collectItemMenuEntries(
  actor: OSEActor | undefined,
  item: OseItem | undefined,
  canEdit: boolean,
): ItemMenuEntry[] {
  if (!actor || !item) return [];
  const entries: ItemMenuEntry[] = [];
  hooks()?.callAll?.(ITEM_CONTEXT_MENU, {
    actor,
    item,
    canEdit,
    entries,
  } satisfies ItemContextMenuHookArgs);
  return entries.filter(isEntry);
}
