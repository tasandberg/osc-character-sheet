import type { OSEActor, OseItem } from "@domain/types";

export function buildItemMacroDragData(actor: OSEActor, item: OseItem): string {
  const dragData = item.toDragData() as Record<string, unknown>;
  dragData.item = item;
  dragData.type = "Item";
  dragData.actorId = actor.id;
  dragData.sceneId = actor.isToken ? (actor.token?.parent?.id ?? null) : null;
  dragData.tokenId = actor.isToken ? (actor.token?.id ?? null) : null;
  dragData.pack = actor.pack ?? null;
  return JSON.stringify(dragData);
}
