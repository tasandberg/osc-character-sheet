/**
 * @file Vitals view-model helpers.
 */

import { formatMod } from "@domain/format";
import type { AcPart } from "@domain/vm-types";

/** Constructor shape of OSE's character-AC class. */
type AcConstructor = new (
  isAscending: boolean,
  equippedArmor: Item[],
  dexMod: number,
  mod: number
) => { value: number; base: number; shield?: number; mod: number };

type ArmorItem = {
  name: string;
  system: { type?: string; ac?: { value?: number }; aac?: { value?: number } };
};

function acParts(
  armor: ArmorItem[],
  ac: { base: number; shield?: number; mod: number },
  dexMod: number,
  isAscending: boolean
): AcPart[] {
  const toward = (n: number) => formatMod(isAscending ? n : -n);
  const prop = isAscending ? "aac" : "ac";
  const worn = armor.find((a) => a.system.type !== "shield");
  const wornValue = worn?.system[prop]?.value;
  const shieldItem = armor.find((a) => a.system.type === "shield");
  const parts: AcPart[] = [
    worn && (wornValue || wornValue === 0)
      ? { label: worn.name, value: `${wornValue}` }
      : { label: "Unarmoured", value: `${ac.base}` },
  ];
  if (dexMod) parts.push({ label: "DEX", value: toward(dexMod) });
  if (shieldItem && ac.shield)
    parts.push({ label: shieldItem.name, value: toward(ac.shield) });
  if (ac.mod) parts.push({ label: "Modifier", value: toward(ac.mod) });
  return parts;
}

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
): { value: number; ascending: boolean; parts: AcPart[] } {
  const active = isAscending ? aac : ac;
  const dexMod = isAscending
    ? active.naked - active.base
    : active.base - active.naked;
  const Ctor = (active as { constructor: unknown }).constructor as AcConstructor;
  const recomputed = new Ctor(isAscending, equippedArmor, dexMod, active.mod);
  return {
    value: recomputed.value,
    ascending: isAscending,
    parts: acParts(
      equippedArmor as unknown as ArmorItem[],
      recomputed,
      dexMod,
      isAscending
    ),
  };
}
