import type { OSEActor } from "@domain/types";

/** Minimal shape for an ability-item create — fvtt-types doesn't know OSE subtypes. */
type AbilityCreateData = {
  type: "ability";
  name: string;
  system: { requirements: string };
};

/**
 * Create a new `ability` Item on the actor and open its sheet for editing.
 * `slug` seeds `system.requirements` so the new feature lands in the right
 * class/race section (empty ⇒ "Other").
 */
export async function createAbility(actor: OSEActor, slug = ""): Promise<void> {
  const data: AbilityCreateData = {
    type: "ability",
    // Foundry's standard "New <Type>" naming (localized), e.g. "Ability".
    name: Item.implementation.defaultName({
      // OSE subtype not in fvtt-types' union.
      type: "ability" as Item.SubType,
      parent: actor,
    }),
    system: { requirements: slug },
  };
  const created = await actor.createEmbeddedDocuments(
    "Item",
    // OSE subtypes aren't in fvtt-types' union; cast the create payload.
    [data] as unknown as Parameters<OSEActor["createEmbeddedDocuments"]>[1]
  );
  // Foundry returns the created docs; open the first so the user can fill it in.
  created?.[0]?.sheet?.render(true);
}
