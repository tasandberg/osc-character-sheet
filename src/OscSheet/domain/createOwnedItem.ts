import type { OSEActor } from "@domain/types";

/** Create an embedded Item of any OSE type on the actor and open its sheet. */
export async function createOwnedItem(
  actor: OSEActor,
  type: string,
): Promise<void> {
  const data = {
    type,
    // Foundry's standard "New <Type>" naming (localized).
    name: Item.implementation.defaultName({
      // OSE subtypes aren't in fvtt-types' union.
      type: type as Item.SubType,
      parent: actor,
    }),
  };
  const created = await actor.createEmbeddedDocuments(
    "Item",
    [data] as unknown as Parameters<OSEActor["createEmbeddedDocuments"]>[1],
  );
  created?.[0]?.sheet?.render(true);
}
