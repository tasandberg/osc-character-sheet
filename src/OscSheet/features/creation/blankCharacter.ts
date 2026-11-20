import type { OSEActor } from "@domain/types";

const SCORES = ["str", "int", "wis", "dex", "con", "cha"] as const;

function ownedItemCount(actor: OSEActor): number {
  const items = actor.items as
    { size?: number; length?: number; contents?: unknown[] } | undefined;
  return items?.size ?? items?.contents?.length ?? items?.length ?? 0;
}

export function isBlankCharacter(actor: OSEActor): boolean {
  return (
    (actor as { type?: string }).type === "character" &&
    SCORES.every((key) => !actor.system.scores?.[key]?.value) &&
    ownedItemCount(actor) === 0
  );
}
