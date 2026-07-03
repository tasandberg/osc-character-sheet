import type { OSEActor } from "@domain/types";
import type { AbilityVM } from "@domain/vm-types";
import { formatMod } from "@domain/format";

const ABILITY_ORDER = [
  { key: "str", label: "STR" },
  { key: "int", label: "INT" },
  { key: "wis", label: "WIS" },
  { key: "dex", label: "DEX" },
  { key: "con", label: "CON" },
  { key: "cha", label: "CHA" },
] as const;

export function selectAbilities(actor: OSEActor): AbilityVM[] {
  const scores = actor.system.scores;
  return ABILITY_ORDER.map(({ key, label }) => {
    const s = scores[key];
    return {
      key,
      label,
      value: s.value,
      mod: s.mod,
      modLabel: formatMod(s.mod),
    };
  });
}
