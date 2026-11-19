import { getSetting } from "@src/OscSheet/settings";
import type { RaceMode } from "./race/raceDraft";
import { SCORE_METHODS, type ScoreMethod } from "./scores/scoresDraft";

export type HouseRule = { name: string; tag: string; detail: string };

export type HouseRuleSettings = {
  encumbranceOption: unknown;
  ascendingAC: unknown;
  maxHitPointsAtFirstLevel?: boolean;
  raceMode?: RaceMode;
  scoreMethods?: ScoreMethod[];
};

const SCORE_METHOD: Record<ScoreMethod, { only: string; none: string }> = {
  inOrder: { only: "3d6 in order only", none: "No 3d6 in order" },
  arrange: { only: "Roll and arrange only", none: "No roll and arrange" },
  manual: { only: "Manual scores only", none: "No manual scores" },
};

const SCORE_METHOD_DETAIL: Record<ScoreMethod, string> = {
  inOrder: "3d6 in order",
  arrange: "roll and arrange",
  manual: "entered manually",
};

function scoreMethodRule(methods: ScoreMethod[] = []): HouseRule[] {
  const allowed = SCORE_METHODS.filter((method) => methods.includes(method));
  const barred = SCORE_METHODS.filter((method) => !methods.includes(method));
  if (!allowed.length || !barred.length) return [];
  const detail = allowed.map((method) => SCORE_METHOD_DETAIL[method]);
  return [
    {
      name: "Ability scores",
      tag:
        allowed.length === 1
          ? SCORE_METHOD[allowed[0]].only
          : barred.map((method) => SCORE_METHOD[method].none).join(", "),
      detail: `${detail[0][0].toUpperCase()}${detail.join(" or ").slice(1)}`,
    },
  ];
}

const RACE_MODE: Record<RaceMode, { tag: string; detail: string }> = {
  separate: {
    tag: "Separate race",
    detail: "Separate — pick a race, then a class it allows",
  },
  asClass: {
    tag: "Race as class",
    detail: "Race as class — demihumans are classes of their own",
  },
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
  raceMode,
  scoreMethods,
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
    ...(raceMode ? [{ name: "Race", ...RACE_MODE[raceMode] }] : []),
    ...scoreMethodRule(scoreMethods),
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
