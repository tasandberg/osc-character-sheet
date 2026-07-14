import type { OSEActor } from "@domain/types";

/** OSE item types the inventory can create. `spell`/`ability` live on their own tabs. */
export const INVENTORY_ITEM_TYPES = [
  "weapon",
  "armor",
  "item",
  "container",
] as const;
export type InventoryItemType = (typeof INVENTORY_ITEM_TYPES)[number];

/** Minimal shape for an inventory-item create — fvtt-types doesn't know OSE subtypes. */
type ItemCreateData = { type: InventoryItemType; name: string };

/** Create a new inventory Item on the actor and open its sheet for editing. */
export async function createItem(
  actor: OSEActor,
  type: InventoryItemType,
): Promise<void> {
  const data: ItemCreateData = {
    type,
    // Foundry's standard "New <Type>" naming (localized).
    name: Item.implementation.defaultName({
      // OSE subtype not in fvtt-types' union.
      type: type as Item.SubType,
      parent: actor,
    }),
  };
  const created = await actor.createEmbeddedDocuments(
    "Item",
    // OSE subtypes aren't in fvtt-types' union; cast the create payload.
    [data] as unknown as Parameters<OSEActor["createEmbeddedDocuments"]>[1],
  );
  // Foundry returns the created docs; open the first so the user can fill it in.
  created?.[0]?.sheet?.render(true);
}
