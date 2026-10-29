import type { OSEActor } from "@domain/types";
import type { AbilityDetailVM, AbilityVM } from "@domain/vm-types";
import { formatMod } from "@domain/format";

const ABILITY_ORDER = [
  { key: "str", label: "STR" },
  { key: "int", label: "INT" },
  { key: "wis", label: "WIS" },
  { key: "dex", label: "DEX" },
  { key: "con", label: "CON" },
  { key: "cha", label: "CHA" },
] as const;

type AbilityKey = (typeof ABILITY_ORDER)[number]["key"];

function selectDetails(
  scores: OSEActor["system"]["scores"],
  key: AbilityKey,
): AbilityDetailVM[] {
  const { str, int, wis, dex, con, cha } = scores;
  switch (key) {
    case "str":
      return [
        { labelKey: "OSE.Melee", value: formatMod(str.mod) },
        { labelKey: "OSE.exploration.od.long", value: `${str.od} in 6` },
      ];
    case "int":
      return [
        {
          labelKey: "OSE.SpokenLanguages",
          value: int.spoken,
          localizeValue: true,
        },
        { labelKey: "OSE.Literacy", value: int.literacy, localizeValue: true },
      ];
    case "wis":
      return [{ labelKey: "OSE.saves.magic.long", value: formatMod(wis.mod) }];
    case "dex":
      return [
        { labelKey: "OSE.Missile", value: formatMod(dex.mod) },
        { labelKey: "OSE.Initiative", value: formatMod(dex.init) },
        { labelKey: "OSE.ArmorClass", value: formatMod(dex.mod) },
      ];
    case "con":
      return [{ labelKey: "OSE.Health", value: formatMod(con.mod) }];
    case "cha":
      return [
        { labelKey: "OSE.NPCReaction", value: formatMod(cha.npc) },
        { labelKey: "OSE.RetainersMax", value: `${cha.retain}` },
        { labelKey: "OSE.Loyalty", value: `${cha.loyalty}` },
      ];
  }
}

export function selectAbilities(actor: OSEActor): AbilityVM[] {
  const scores = actor.system.scores;
  return ABILITY_ORDER.map(({ key, label }) => {
    const s = scores[key];
    return {
      key,
      label,
      nameKey: `OSE.scores.${key}.long`,
      value: s.value,
      mod: s.mod,
      modLabel: formatMod(s.mod),
      details: selectDetails(scores, key),
    };
  });
}
