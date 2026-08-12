import type { OSEActor } from "@domain/types";
import { createOwnedItem } from "@domain/createOwnedItem";

/** OSE item types the inventory can create. `spell`/`ability` live on their own tabs. */
export const INVENTORY_ITEM_TYPES = [
  "weapon",
  "armor",
  "item",
  "container",
] as const;
export type InventoryItemType = (typeof INVENTORY_ITEM_TYPES)[number];

export function createItem(
  actor: OSEActor,
  type: InventoryItemType,
): Promise<void> {
  return createOwnedItem(actor, type);
}
