import type { OSEActor } from "@domain/types";

const SCORES = ["str", "int", "wis", "dex", "con", "cha"] as const;

export function isBlankCharacter(actor: OSEActor): boolean {
  return (
    (actor as { type?: string }).type === "character" &&
    SCORES.every((key) => !actor.system.scores?.[key]?.value)
  );
}
