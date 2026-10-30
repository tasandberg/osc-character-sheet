import { getSetting } from "@src/OscSheet/settings";
import { foundryRaceDetail, loadRaces } from "./race/foundryRaces";
import type { CreationRace } from "./race/raceItems";
import type { OSEActor } from "@domain/types";
import {
  ClassItems,
  loadClassItems,
  transientCharacter,
} from "./class/classItems";
import {
  foundryAlignmentText,
  maximumHitPoints,
  rollHitPoints,
} from "./details/foundryDetails";
import { loadGearCatalog, previewLoad } from "./gear/foundryGear";
import { createCharacter } from "./review/foundryCreate";
import type { CreationRules } from "./rules";
import { ABILITIES, type AbilityScores } from "./scores/scoresDraft";

const known = (scores: AbilityScores) =>
  ABILITIES.filter((a) => scores[a] !== undefined);

function modifiers(scores: AbilityScores): AbilityScores {
  const abilities = known(scores);
  if (!abilities.length) return {};
  const actor = transientCharacter(scores);
  return Object.fromEntries(
    abilities.map((a) => [a, actor.system.scores[a].mod]),
  ) as AbilityScores;
}

function raceScores(scores: AbilityScores, race?: CreationRace): AbilityScores {
  const abilities = known(scores);
  if (!race || !abilities.length) return scores;
  const actor = transientCharacter(scores, [race.source]);
  return Object.fromEntries(
    abilities.map((a) => [a, actor.system.scores[a].value]),
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

export async function foundryCreationRules(
  actor?: OSEActor,
): Promise<CreationRules> {
  const [classItems, races] = await Promise.all([
    loadClassItems().then((items) => new ClassItems(items)),
    loadRaces(),
  ]);
  return {
    classes: classItems.classes,
    classDetail: (uuid) => classItems.detail(uuid),
    classStats: (cls, level) => classItems.stats(cls, level),
    xpBonus: (cls, scores) => classItems.xpBonus(cls, scores),
    races,
    raceDetail: foundryRaceDetail(races),
    raceScores,
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
    createCharacter: createCharacter(classItems, actor),
  };
}
