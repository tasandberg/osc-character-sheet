import {
  activeClassSet,
  foundryClassDetail,
  foundryClasses,
} from "./class/foundryClasses";
import { getSetting } from "@src/OscSheet/settings";
import { foundryRaceDetail, tomeActive } from "./race/foundryRaces";
import {
  foundryAlignmentText,
  maximumHitPoints,
  rollHitPoints,
} from "./details/foundryDetails";
import { loadGearCatalog, previewLoad } from "./gear/foundryGear";
import type { CreationRules } from "./rules";
import {
  ABILITIES,
  type Ability,
  type AbilityScores,
} from "./scores/scoresDraft";

type ScoredActor = { system: { scores: Record<Ability, { mod: number }> } };

function modifiers(scores: AbilityScores): AbilityScores {
  const known = ABILITIES.filter((a) => scores[a] !== undefined);
  if (!known.length) return {};
  const ActorClass = CONFIG.Actor.documentClass as unknown as new (
    data: object,
  ) => ScoredActor;
  const actor = new ActorClass({
    name: "New character",
    type: "character",
    system: {
      scores: Object.fromEntries(
        ABILITIES.map((a) => [a, { value: scores[a] ?? 0, bonus: 0 }]),
      ),
    },
  });
  return Object.fromEntries(
    known.map((a) => [a, actor.system.scores[a].mod]),
  ) as AbilityScores;
}

const SAVE_KEYS = ["death", "wand", "paralysis", "breath", "spell"];

const saveNames = () => {
  const names = (CONFIG.OSE?.saves_long ?? {}) as Record<string, string>;
  return SAVE_KEYS.map((key) => game.i18n?.localize(names[key] ?? key) ?? key);
};

async function rollScore(label: string) {
  const roll = await new Roll("3d6").evaluate();
  await roll.toMessage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { speaker: { alias: game.user?.name }, flavor: `${label} (3d6)` } as any,
  );
  return {
    total: roll.total ?? 0,
    dice: roll.dice.flatMap((die) => die.results.map((r) => r.result)),
  };
}

function cachedGearCatalog() {
  let load: ReturnType<typeof loadGearCatalog> | undefined;
  return () => {
    load ??= loadGearCatalog();
    load.catch(() => (load = undefined));
    return load;
  };
}

export function foundryCreationRules(): CreationRules {
  const set = activeClassSet();
  return {
    classes: foundryClasses(set),
    classDetail: foundryClassDetail(set),
    separateRaces: tomeActive() && getSetting("separateRaceAndClass"),
    raceDetail: foundryRaceDetail(),
    modifiers,
    rollScore,
    maxHitPointsAtFirstLevel: getSetting("maxHitPointsAtFirstLevel"),
    maximumHitPoints,
    rollHitPoints,
    alignmentText: foundryAlignmentText(),
    saveNames: saveNames(),
    rollStartingGold: rollHitPoints,
    loadGearCatalog: cachedGearCatalog(),
    previewLoad,
    openItemSheet: (uuid) => {
      void fromUuid(uuid).then((doc) => {
        (doc as Item | null)?.sheet?.render(true);
      });
    },
  };
}
