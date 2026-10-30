import {
  ABILITIES,
  type Ability,
  type AbilityScores,
} from "../scores/scoresDraft";

export type ItemSource = Record<string, unknown>;

export type ScoreBound = { min: number | null; max: number | null };

export type ClassLimit = { classKey: string; maxLevel: number };

export type GrantedAbility = { uuid: string; level: number };

export type CreationRace = {
  uuid: string;
  name: string;
  key: string;
  description: string;
  requirements: Partial<Record<Ability, ScoreBound>>;
  modifiers: AbilityScores;
  classLimits: ClassLimit[];
  languages: string[];
  abilities: GrantedAbility[];
  source: ItemSource;
};

type RawChange = { key: string; mode?: number; type?: string; value: unknown };
type RawEffect = {
  name?: string;
  flags?: Record<string, { raceModifiers?: boolean } | undefined>;
  changes?: RawChange[];
  system?: { changes?: RawChange[] };
};

export type RaceItemSource = {
  name: string;
  system: {
    key?: string;
    description?: string;
    requirements?: Partial<Record<string, Partial<ScoreBound>>>;
    languages?: string[];
    classLimits?: ClassLimit[];
    abilities?: GrantedAbility[];
  };
  effects?: RawEffect[];
};

const ADD_MODE = 2;
const SCORE_KEY = /^system\.scores\.(\w+)\.value$/;

const isAbility = (key: string): key is Ability =>
  (ABILITIES as readonly string[]).includes(key);

function raceModifiers(effects: RawEffect[], systemId: string): AbilityScores {
  const effect = effects.find((e) => e.flags?.[systemId]?.raceModifiers);
  const changes = effect?.system?.changes ?? effect?.changes ?? [];
  const modifiers: AbilityScores = {};
  for (const change of changes) {
    const score = SCORE_KEY.exec(change.key)?.[1];
    const adds = change.type
      ? change.type === "add"
      : change.mode !== undefined
        ? change.mode === ADD_MODE
        : true;
    if (!score || !isAbility(score) || !adds) continue;
    const value = Number(change.value) || 0;
    if (value) modifiers[score] = (modifiers[score] ?? 0) + value;
  }
  return modifiers;
}

function requirements(
  raw: RaceItemSource["system"]["requirements"] = {},
): CreationRace["requirements"] {
  const bounds: CreationRace["requirements"] = {};
  for (const ability of ABILITIES) {
    const { min = null, max = null } = raw[ability] ?? {};
    if (min !== null || max !== null) bounds[ability] = { min, max };
  }
  return bounds;
}

export function raceFromItem(
  uuid: string,
  source: RaceItemSource,
  systemId: string,
): CreationRace {
  const { system } = source;
  return {
    uuid,
    name: source.name,
    key: system.key ?? "",
    description: system.description ?? "",
    requirements: requirements(system.requirements),
    modifiers: raceModifiers(source.effects ?? [], systemId),
    classLimits: system.classLimits ?? [],
    languages: system.languages ?? [],
    abilities: system.abilities ?? [],
    source: source as unknown as ItemSource,
  };
}
