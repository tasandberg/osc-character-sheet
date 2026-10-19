import type { Ability } from "../scores/scoresDraft";

export type AbilityMinimums = Partial<Record<Ability, number>>;

export type XpModifierTier = { modifier: number; anyOf: AbilityMinimums[] };

export type ScoreBand = { min: number; max: number; modifier: number };

export type ClassRuleConstants = {
  primeRequisites: Ability[];
  xpModifiers?: XpModifierTier[];
  languages: string[];
};

export const SINGLE_PRIME_REQUISITE_XP: ScoreBand[] = [
  { min: 3, max: 5, modifier: -20 },
  { min: 6, max: 8, modifier: -10 },
  { min: 9, max: 12, modifier: 0 },
  { min: 13, max: 15, modifier: 5 },
  { min: 16, max: 18, modifier: 10 },
];

export const BASELINE_LANGUAGES = ["Alignment", "Common"];

export const IN_SIX_SKILLS = ["hn"];

const eitherAtLeast13 = (a: Ability, b: Ability): XpModifierTier => ({
  modifier: 5,
  anyOf: [{ [a]: 13 }, { [b]: 13 }],
});

export const CLASS_RULE_CONSTANTS: Record<string, ClassRuleConstants> = {
  Acrobat: { primeRequisites: ["dex"], languages: [] },
  Assassin: { primeRequisites: ["dex"], languages: [] },
  Barbarian: {
    primeRequisites: ["con", "str"],
    xpModifiers: [
      { modifier: 10, anyOf: [{ con: 16, str: 16 }] },
      eitherAtLeast13("con", "str"),
    ],
    languages: [],
  },
  Bard: { primeRequisites: ["cha"], languages: [] },
  Cleric: { primeRequisites: ["wis"], languages: [] },
  Drow: {
    primeRequisites: ["str", "wis"],
    xpModifiers: [
      { modifier: 10, anyOf: [{ str: 13, wis: 16 }] },
      { modifier: 5, anyOf: [{ str: 13, wis: 13 }] },
    ],
    languages: ["Deepcommon", "Elvish", "Gnomish", "Spiders"],
  },
  Druid: { primeRequisites: ["wis"], languages: ["Druidic"] },
  Duergar: {
    primeRequisites: ["str"],
    languages: ["Deepcommon", "Dwarvish", "Gnomish", "Goblin", "Kobold"],
  },
  Dwarf: {
    primeRequisites: ["str"],
    languages: ["Dwarvish", "Gnomish", "Goblin", "Kobold"],
  },
  Elf: {
    primeRequisites: ["int", "str"],
    xpModifiers: [
      { modifier: 10, anyOf: [{ int: 16, str: 13 }] },
      { modifier: 5, anyOf: [{ int: 13, str: 13 }] },
    ],
    languages: ["Elvish", "Gnoll", "Hobgoblin", "Orcish"],
  },
  Fighter: { primeRequisites: ["str"], languages: [] },
  Gnome: {
    primeRequisites: ["dex", "int"],
    xpModifiers: [
      { modifier: 10, anyOf: [{ dex: 13, int: 16 }] },
      { modifier: 5, anyOf: [{ dex: 13, int: 13 }] },
    ],
    languages: ["Gnomish", "Dwarvish", "Kobold", "Burrowing mammals"],
  },
  "Half-Elf": {
    primeRequisites: ["int", "str"],
    xpModifiers: [
      {
        modifier: 10,
        anyOf: [
          { int: 16, str: 13 },
          { int: 13, str: 16 },
        ],
      },
      { modifier: 5, anyOf: [{ int: 13, str: 13 }] },
    ],
    languages: ["Elvish"],
  },
  "Half-Orc": {
    primeRequisites: ["dex", "str"],
    xpModifiers: [
      { modifier: 10, anyOf: [{ dex: 16, str: 16 }] },
      { modifier: 5, anyOf: [{ dex: 13, str: 13 }] },
    ],
    languages: ["Orcish"],
  },
  Halfling: {
    primeRequisites: ["dex", "str"],
    xpModifiers: [
      { modifier: 10, anyOf: [{ dex: 13, str: 13 }] },
      eitherAtLeast13("dex", "str"),
    ],
    languages: ["Halfling"],
  },
  Illusionist: { primeRequisites: ["int"], languages: [] },
  Knight: { primeRequisites: ["str"], languages: [] },
  "Magic-User": { primeRequisites: ["int"], languages: [] },
  Paladin: {
    primeRequisites: ["str", "wis"],
    xpModifiers: [
      { modifier: 10, anyOf: [{ str: 16, wis: 16 }] },
      eitherAtLeast13("str", "wis"),
    ],
    languages: [],
  },
  Ranger: { primeRequisites: ["str"], languages: [] },
  Svirfneblin: {
    primeRequisites: ["str"],
    languages: [
      "Deepcommon",
      "Gnomish",
      "Dwarvish",
      "Kobold",
      "Earth elementals",
    ],
  },
  Thief: { primeRequisites: ["dex"], languages: [] },
};

const canon = (name: string) => name.toLowerCase().replace(/[^a-z]/g, "");

export function classRuleConstants(
  className: string,
): ClassRuleConstants | undefined {
  const want = canon(className);
  const key = Object.keys(CLASS_RULE_CONSTANTS).find((k) => canon(k) === want);
  return key ? CLASS_RULE_CONSTANTS[key] : undefined;
}

export const nativeLanguages = (className: string) => [
  ...BASELINE_LANGUAGES,
  ...(classRuleConstants(className)?.languages ?? []),
];
