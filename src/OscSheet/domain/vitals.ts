/**
 * @file Vitals view-model helpers.
 */

/** Constructor shape of OSE's character-AC class. */
type AcConstructor = new (
  isAscending: boolean,
  equippedArmor: Item[],
  dexMod: number,
  mod: number
) => { value: number };

/** The live AC instance read off the actor (`actor.system.ac` / `.aac`). */
type AcInstance = { base: number; naked: number; mod: number };

/**
 * Resolved AC for display. Observes the ascendingAC setting (`isAscending`) to pick the
 * scheme, then recomputes from the optimistically-overlaid equipped armour (so equip is
 * instant) via the actor's OWN AC class (`active.constructor`) — the calc stays OSE's.
 * `dexMod` is recovered from the live instance (`naked = base ± dexMod`); `mod` read off it.
 */
export function selectAc(
  aac: AcInstance,
  ac: AcInstance,
  equippedArmor: Item[],
  isAscending: boolean
): { value: number; ascending: boolean } {
  const active = isAscending ? aac : ac;
  const dexMod = isAscending
    ? active.naked - active.base
    : active.base - active.naked;
  const Ctor = (active as { constructor: unknown }).constructor as AcConstructor;
  const recomputed = new Ctor(isAscending, equippedArmor, dexMod, active.mod);
  return { value: recomputed.value, ascending: isAscending };
}
