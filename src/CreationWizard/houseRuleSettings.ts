import { getSetting } from "@src/OscSheet/settings";

export type HouseRule = { name: string; tag: string; detail: string };

export type HouseRuleSettings = {
  encumbranceOption: unknown;
  ascendingAC: unknown;
  maxHitPointsAtFirstLevel?: boolean;
};

const ENCUMBRANCE: Record<string, { tag: string; detail: string }> = {
  disabled: { tag: "No encumbrance", detail: "Off — weight isn’t tracked" },
  basic: {
    tag: "Basic encumbrance",
    detail: "Basic — armour and treasure count",
  },
  detailed: {
    tag: "Detailed encumbrance",
    detail:
      "Detailed — armour, weapons and treasure count; other gear is 80 coins",
  },
  complete: {
    tag: "Complete encumbrance",
    detail: "Complete — every item’s weight counts",
  },
  itembased: {
    tag: "Item-based encumbrance",
    detail: "Item-based — load is counted in items",
  },
};

export function houseRules({
  encumbranceOption,
  ascendingAC,
  maxHitPointsAtFirstLevel,
}: HouseRuleSettings): HouseRule[] {
  const encumbrance =
    ENCUMBRANCE[String(encumbranceOption)] ?? ENCUMBRANCE.disabled;
  return [
    ascendingAC
      ? {
          name: "Armour class",
          tag: "Ascending AC",
          detail: "Ascending, with attack bonus",
        }
      : {
          name: "Armour class",
          tag: "Descending AC",
          detail: "Descending, with THAC0",
        },
    { name: "Encumbrance", ...encumbrance },
    ...(maxHitPointsAtFirstLevel
      ? [
          {
            name: "Hit points",
            tag: "Max HP at 1st level",
            detail:
              "1st-level characters start with the most their Hit Die allows",
          },
        ]
      : []),
  ];
}

export function readHouseRuleSettings(): HouseRuleSettings {
  const read = (key: string) => {
    try {
      const settings = game.settings as {
        get(ns: string, key: string): unknown;
      };
      return settings.get(game.system.id, key);
    } catch {
      return undefined;
    }
  };
  return {
    encumbranceOption: read("encumbranceOption"),
    ascendingAC: read("ascendingAC"),
    maxHitPointsAtFirstLevel: getSetting("maxHitPointsAtFirstLevel"),
  };
}
