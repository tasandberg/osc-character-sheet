import {
  abbreviation,
  type Ability,
  type AbilityScores,
} from "../scores/scoresDraft";
import {
  SINGLE_PRIME_REQUISITE_XP,
  type AbilityMinimums,
  type XpModifierTier,
} from "./classConstants";

export type PrimeRequisiteRules = {
  primeRequisites: Ability[];
  xpModifiers?: XpModifierTier[];
};

export type XpAdjustment = { modifier: number; basis: string };

const meets = (minimums: AbilityMinimums, scores: AbilityScores) =>
  (Object.entries(minimums) as [Ability, number][]).every(
    ([ability, min]) => (scores[ability] ?? 0) >= min,
  );

export function xpAdjustment(
  { primeRequisites, xpModifiers }: PrimeRequisiteRules,
  scores: AbilityScores,
): XpAdjustment | undefined {
  if (!primeRequisites.length) return undefined;
  if (primeRequisites.some((a) => scores[a] === undefined)) return undefined;
  const basis = primeRequisites
    .map((a) => `${abbreviation(a)} ${scores[a]}`)
    .join(", ");
  if (xpModifiers?.length) {
    const tier = xpModifiers.find(({ anyOf }) =>
      anyOf.some((minimums) => meets(minimums, scores)),
    );
    return { modifier: tier?.modifier ?? 0, basis };
  }
  const score = scores[primeRequisites[0]]!;
  const band = SINGLE_PRIME_REQUISITE_XP.find(
    ({ min, max }) => score >= min && score <= max,
  );
  return { modifier: band?.modifier ?? 0, basis };
}

export const formatXpModifier = (modifier: number) =>
  modifier > 0 ? `+${modifier}%` : modifier < 0 ? `−${-modifier}%` : "±0%";

export const xpTone = (modifier: number) =>
  modifier > 0 ? "up" : modifier < 0 ? "down" : "flat";
