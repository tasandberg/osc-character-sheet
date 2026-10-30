import {
  activeClassSet,
  foundryClassDetail,
  foundryClasses,
} from "./class/foundryClasses";
import { getSetting } from "@src/OscSheet/settings";
import { foundryRaceDetail, loadRaces } from "./race/foundryRaces";
import type { CreationRace, ItemSource } from "./race/raceItems";
import {
  foundryAlignmentText,
  maximumHitPoints,
  rollHitPoints,
} from "./details/foundryDetails";
import { loadGearCatalog, previewLoad } from "./gear/foundryGear";
import { createCharacter } from "./review/foundryCreate";
import type { CreationRules } from "./rules";
import type { OSEActor } from "@domain/types";
import {
  ABILITIES,
  type Ability,
  type AbilityScores,
} from "./scores/scoresDraft";

type ScoredActor = {
  system: { scores: Record<Ability, { value: number; mod: number }> };
};

function transientActor(scores: AbilityScores, items: ItemSource[] = []) {
  const ActorClass = CONFIG.Actor.documentClass as unknown as new (
    data: object,
  ) => ScoredActor;
  return new ActorClass({
    name: "New character",
    type: "character",
    system: {
      scores: Object.fromEntries(
        ABILITIES.map((a) => [a, { value: scores[a] ?? 0, bonus: 0 }]),
      ),
    },
    items,
  });
}

const known = (scores: AbilityScores) =>
  ABILITIES.filter((a) => scores[a] !== undefined);

function modifiers(scores: AbilityScores): AbilityScores {
  const abilities = known(scores);
  if (!abilities.length) return {};
  const actor = transientActor(scores);
  return Object.fromEntries(
    abilities.map((a) => [a, actor.system.scores[a].mod]),
  ) as AbilityScores;
}

function raceScores(scores: AbilityScores, race?: CreationRace): AbilityScores {
  const abilities = known(scores);
  if (!race || !abilities.length) return scores;
  const actor = transientActor(scores, [race.source]);
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
  const set = activeClassSet();
  const races = await loadRaces();
  return {
    classes: foundryClasses(set),
    classDetail: foundryClassDetail(set),
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
    createCharacter: createCharacter(actor),
  };
}
