// Read the user's current attack target from `game.user.targets` (a Set of placed
// Tokens). OSE is B/X: we evaluate the attack against ONE target — the first in the
// set — to keep the chat card unambiguous (Foundry lets you target several, but a
// single sheet hit-cell is one die). No target → undefined (roll plain, no hit line).

import type { OSEActor } from "@domain/types";

export interface TargetInfo {
  /** The targeted actor (token.actor). */
  actor: OSEActor;
  /** Display name (token name falls back to actor name). */
  name: string;
  /** Token document uuid — lets the apply-damage handler re-resolve the actor. */
  uuid: string;
  /** Ascending AC (higher = harder). OSE `system.aac.value`, default 10. */
  aac: number;
  /** Descending AC (lower = harder). OSE `system.ac.value`, default 9. */
  ac: number;
}

/** Whether OSE is running in ascending-AC mode (game setting). */
export function usesAscendingAC(): boolean {
  try {
    // fvtt-types narrows the scope arg to core ids; the OSE system setting is dynamic.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Boolean((game.settings as any).get(game.system.id, "ascendingAC"));
  } catch {
    return false;
  }
}

/** The current single target (first of `game.user.targets`), or undefined. */
export function currentTarget(): TargetInfo | undefined {
  const targets = game.user?.targets;
  if (!targets || targets.size === 0) return undefined;
  const token = targets.first?.() ?? [...targets][0];
  const actor = token?.actor as OSEActor | undefined;
  if (!actor) return undefined;
  const sys = actor.system as { ac?: { value: number }; aac?: { value: number } };
  return {
    actor,
    name: (token.name as string) || (actor.name as string),
    uuid: (token.document?.uuid as string) ?? "",
    aac: sys.aac?.value ?? 10,
    ac: sys.ac?.value ?? 9,
  };
}
