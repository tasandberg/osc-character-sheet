import type { ClassRestrictions, CreationClass, CreationRules } from "../rules";
import { classStanding } from "../scores/classStanding";
import {
  abbreviation,
  type Ability,
  type AbilityScores,
} from "../scores/scoresDraft";

const listed = (items: string[]) =>
  items.length > 1
    ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
    : (items[0] ?? "");

export const requirementList = (cls: CreationClass) =>
  (Object.entries(cls.requirements) as [Ability, number][]).map(
    ([ability, min]) => `${abbreviation(ability)} ${min}`,
  );

const isAllowed = (cls: CreationClass, restrictions?: ClassRestrictions) =>
  !restrictions?.allowed || restrictions.allowed(cls.name);

export const ineligibleReason = (
  cls: CreationClass,
  restrictions?: ClassRestrictions,
) =>
  isAllowed(cls, restrictions)
    ? `${cls.name} requires ${listed(requirementList(cls))}`
    : `${cls.name} isn’t open to this character`;

export const isEligible = (
  cls: CreationClass,
  scores: AbilityScores,
  restrictions?: ClassRestrictions,
) =>
  isAllowed(cls, restrictions) && classStanding(cls, scores).status === "open";

export function classBlockedReason(
  cls: CreationClass | undefined,
  scores: AbilityScores,
  restrictions?: ClassRestrictions,
): string | undefined {
  if (!cls) return "Choose a class to continue";
  if (!isAllowed(cls, restrictions))
    return `${cls.name} isn’t open to this character; choose another class`;
  if (!isEligible(cls, scores, restrictions))
    return `Your scores no longer allow ${cls.name}; choose another class`;
  return undefined;
}

export type XpAdjustment = { modifier: number; basis: string };

export function xpAdjustment(
  cls: CreationClass,
  scores: AbilityScores,
  xpBonus: CreationRules["xpBonus"],
): XpAdjustment | undefined {
  if (!cls.primeRequisites.length) return undefined;
  if (cls.primeRequisites.some((a) => scores[a] === undefined))
    return undefined;
  return {
    modifier: xpBonus(cls, scores),
    basis: cls.primeRequisites
      .map((a) => `${abbreviation(a)} ${scores[a]}`)
      .join(", "),
  };
}

export const formatXpModifier = (modifier: number) =>
  modifier > 0 ? `+${modifier}%` : modifier < 0 ? `−${-modifier}%` : "±0%";

export const xpTone = (modifier: number) =>
  modifier > 0 ? "up" : modifier < 0 ? "down" : "flat";

export function classSummary(
  cls: CreationClass | undefined,
  scores: AbilityScores,
  restrictions: ClassRestrictions | undefined,
  xpBonus: CreationRules["xpBonus"],
): string | undefined {
  if (!cls || classBlockedReason(cls, scores, restrictions)) return undefined;
  const xp = xpAdjustment(cls, scores, xpBonus);
  return xp ? `${cls.name} · ${formatXpModifier(xp.modifier)} XP` : cls.name;
}

export const characterLanguages = (
  cls: CreationClass,
  extra: string[] = [],
) => [...new Set([...cls.languages, ...extra])];
