import type { OSEActor, OseClassItem } from "@domain/types";

export function classItems(actor: OSEActor): OseClassItem[] {
  return actor.system.classes ?? [];
}

export function isDerivedFromClasses(actor: OSEActor): boolean {
  return actor.system.derivedFromClasses === true;
}
