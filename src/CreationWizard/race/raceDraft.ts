import type { ClassRestrictions, CreationClass } from "../rules";
import {
  abbreviation,
  type Ability,
  type AbilityScores,
} from "../scores/scoresDraft";
import type { CreationRace, ScoreBound } from "./raceItems";

export type { CreationRace } from "./raceItems";

export type RaceMode = "asClass" | "separate";

type ClassRef = Pick<CreationClass, "name" | "key">;

export const classKeyOf = (cls: ClassRef) =>
  cls.key ?? cls.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const requiredAbilities = (race: CreationRace) =>
  Object.keys(race.requirements) as Ability[];

const describeBound = (ability: Ability, { min, max }: ScoreBound) =>
  min !== null && max !== null
    ? `${abbreviation(ability)} ${min}–${max}`
    : min !== null
      ? `${abbreviation(ability)} ${min}`
      : `${abbreviation(ability)} ≤${max}`;

const describeRequirement = (race: CreationRace, ability: Ability) =>
  describeBound(ability, race.requirements[ability]!);

export const requirementText = (race: CreationRace) =>
  requiredAbilities(race)
    .map((a) => describeRequirement(race, a))
    .join(", ");

const meets = (score: number, { min, max }: ScoreBound) =>
  (min === null || score >= min) && (max === null || score <= max);

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
    (a) => scores[a] !== undefined && !meets(scores[a]!, race.requirements[a]!),
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
      note: unknown.map((a) => describeRequirement(race, a)).join(", "),
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

export const maxLevel = (race: CreationRace, cls: ClassRef) =>
  race.classLimits.find((limit) => limit.classKey === classKeyOf(cls))
    ?.maxLevel;

export function raceRestrictions(
  race: CreationRace,
  classes: CreationClass[],
): ClassRestrictions {
  const byName = (name: string) => classes.find((cls) => cls.name === name);
  const limit = (name: string) => {
    const cls = byName(name);
    return cls && maxLevel(race, cls);
  };
  return {
    allowed: (name) => limit(name) !== undefined,
    maxLevel: limit,
  };
}

export const ordinal = (n: number) =>
  `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;

export const formatMaxLevel = (level: number | undefined) =>
  level === undefined ? "—" : ordinal(level);

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
