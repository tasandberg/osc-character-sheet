import type { ClassRestrictions, CreationClass } from "../rules";
import { formatXpModifier, xpAdjustment } from "../rules/xpAdjustment";
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
  !restrictions?.allowed || restrictions.allowed.has(cls.name);

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
  if (!isEligible(cls, scores, restrictions))
    return `Your scores no longer allow ${cls.name}; choose another class`;
  return undefined;
}

export function classSummary(
  cls: CreationClass | undefined,
  scores: AbilityScores,
): string | undefined {
  if (!cls || classBlockedReason(cls, scores)) return undefined;
  const xp = xpAdjustment(cls, scores);
  return xp ? `${cls.name} · ${formatXpModifier(xp.modifier)} XP` : cls.name;
}
