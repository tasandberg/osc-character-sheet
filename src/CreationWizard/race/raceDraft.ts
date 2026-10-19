import type { ClassRestrictions } from "../rules";
import { BASELINE_LANGUAGES } from "../rules/classConstants";
import {
  CON_SAVE_BONUS,
  RACE_RULE_CONSTANTS,
  RACIAL_ABILITY_VALUES,
  type RaceRuleConstants,
} from "../rules/raceConstants";
import {
  ABILITIES,
  MAX_SCORE,
  MIN_SCORE,
  abbreviation,
  type Ability,
  type AbilityScores,
} from "../scores/scoresDraft";

export type CreationRace = RaceRuleConstants;

export type RaceMode = "asClass" | "separate";

const canon = (name: string) => name.toLowerCase().replace(/[^a-z]/g, "");
const sameName = (a: string, b: string) => canon(a) === canon(b);

export const RACES: CreationRace[] = RACE_RULE_CONSTANTS;

export const isRaceClass = (className: string) =>
  RACES.some((race) => race.name !== "Human" && sameName(race.name, className));

export function adjustedScores(
  scores: AbilityScores,
  race?: CreationRace,
): AbilityScores {
  if (!race) return scores;
  return Object.fromEntries(
    ABILITIES.filter((a) => scores[a] !== undefined).map((a) => [
      a,
      Math.min(
        MAX_SCORE,
        Math.max(MIN_SCORE, scores[a]! + (race.modifiers[a] ?? 0)),
      ),
    ]),
  ) as AbilityScores;
}

const requiredAbilities = (race: CreationRace) =>
  Object.keys(race.requirements) as Ability[];

const describeRequirement = (race: CreationRace, ability: Ability) =>
  `${abbreviation(ability)} ${race.requirements[ability]}`;

export const requirementText = (race: CreationRace) =>
  requiredAbilities(race)
    .map((a) => describeRequirement(race, a))
    .join(", ");

export type RaceStanding = {
  status: "open" | "pending" | "failed";
  note: string;
};

export function raceStanding(
  race: CreationRace,
  scores: AbilityScores,
): RaceStanding {
  const required = requiredAbilities(race);
  const short = required.filter(
    (a) => scores[a] !== undefined && scores[a]! < race.requirements[a]!,
  );
  if (short.length)
    return {
      status: "failed",
      note: short.map((a) => describeRequirement(race, a)).join(", "),
    };
  const unknown = required.filter((a) => scores[a] === undefined);
  if (unknown.length)
    return {
      status: "pending",
      note: unknown.map((a) => `${describeRequirement(race, a)}+`).join(", "),
    };
  return { status: "open", note: "" };
}

export const isRaceEligible = (race: CreationRace, scores: AbilityScores) =>
  raceStanding(race, scores).status === "open";

export function formatModifiers(modifiers: AbilityScores): string {
  const entries = (Object.entries(modifiers) as [Ability, number][])
    .filter(([, value]) => value)
    .sort(
      ([a, x], [b, y]) =>
        y - x || abbreviation(a).localeCompare(abbreviation(b)),
    );
  if (!entries.length) return "None";
  return entries
    .map(([a, v]) => `${v > 0 ? "+" : "−"}${Math.abs(v)} ${abbreviation(a)}`)
    .join(", ");
}

export function maxLevel(
  race: CreationRace,
  className: string,
): number | null | undefined {
  if (race.maxLevels === "anyHumanClass")
    return isRaceClass(className) ? undefined : null;
  const key = Object.keys(race.maxLevels).find((k) => sameName(k, className));
  return key ? race.maxLevels[key] : undefined;
}

export const isNpcOnly = (race: CreationRace, className: string) =>
  race.npcOnly.some((name) => sameName(name, className));

export const raceRestrictions = (race: CreationRace): ClassRestrictions => ({
  allowed: (className) => maxLevel(race, className) !== undefined,
  maxLevel: (className) => maxLevel(race, className) ?? undefined,
});

export const ordinal = (n: number) =>
  `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;

export const formatMaxLevel = (level: number | null | undefined) =>
  level === null ? "No limit" : level === undefined ? "—" : ordinal(level);

export type SaveBonus = { bonus: number; summary: string; basis: string };

export function raceSaveBonus(
  race: CreationRace,
  scores: AbilityScores,
): SaveBonus | undefined {
  const save = race.saveBonus;
  if (!save) return undefined;
  const con = scores.con;
  if (save.bonus === undefined && con === undefined) return undefined;
  const bonus =
    save.bonus ??
    CON_SAVE_BONUS.find(({ min, max }) => con! >= min && con! <= max)?.bonus ??
    0;
  return {
    bonus,
    summary: bonus ? `+${bonus} vs ${save.against}` : "No bonus",
    basis:
      save.bonus === undefined ? `${save.ability}, CON ${con}` : save.ability,
  };
}

export function racialAbilityValue(
  race: CreationRace,
  abilityName: string,
  scores: AbilityScores,
): string | undefined {
  if (sameName(abilityName, "Infravision") && race.infravision)
    return `${race.infravision}′`;
  if (race.saveBonus && sameName(abilityName, race.saveBonus.ability)) {
    const save = raceSaveBonus(race, scores);
    if (!save) return undefined;
    if (race.saveBonus.bonus !== undefined) return save.summary;
    return `${save.bonus ? `+${save.bonus}` : "No"} saves (CON ${scores.con})`;
  }
  const key = Object.keys(RACIAL_ABILITY_VALUES).find((k) =>
    sameName(k, abilityName),
  );
  return key && RACIAL_ABILITY_VALUES[key];
}

export const raceLanguages = (race: CreationRace) => [
  ...BASELINE_LANGUAGES,
  ...race.languages,
];

export function raceBlockedReason(
  race: CreationRace | undefined,
  scores: AbilityScores,
): string | undefined {
  if (!race) return "Choose a race to continue";
  if (!isRaceEligible(race, scores))
    return `Your scores no longer allow ${race.name}; choose another race`;
  return undefined;
}

export const raceSummary = (
  race: CreationRace | undefined,
  scores: AbilityScores,
) => (race && !raceBlockedReason(race, scores) ? race.name : undefined);
