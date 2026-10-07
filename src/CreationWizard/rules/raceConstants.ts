import type { AbilityScores } from "../scores/scoresDraft";

export type RaceSaveBonus = {
  ability: string;
  against: string;
  bonus?: number;
};

export type RaceRuleConstants = {
  name: string;
  requirements: AbilityScores;
  modifiers: AbilityScores;
  maxLevels: Record<string, number> | "anyHumanClass";
  npcOnly: string[];
  languages: string[];
  infravision?: number;
  saveBonus?: RaceSaveBonus;
};

const RESILIENCE = "poison, spells, wands";

export const RACE_RULE_CONSTANTS: RaceRuleConstants[] = [
  {
    name: "Human",
    requirements: {},
    modifiers: {},
    maxLevels: "anyHumanClass",
    npcOnly: [],
    languages: [],
  },
  {
    name: "Drow",
    requirements: { int: 9 },
    modifiers: { dex: 1, con: -1 },
    maxLevels: {
      Acrobat: 10,
      Assassin: 10,
      Cleric: 11,
      Fighter: 7,
      Knight: 9,
      "Magic-User": 9,
      Ranger: 9,
      Thief: 11,
    },
    npcOnly: ["Cleric"],
    languages: ["Deepcommon", "Elvish", "Gnomish"],
    infravision: 90,
  },
  {
    name: "Duergar",
    requirements: { con: 9, int: 9 },
    modifiers: { con: 1, cha: -1 },
    maxLevels: { Assassin: 9, Cleric: 8, Fighter: 9, Thief: 9 },
    npcOnly: ["Cleric"],
    languages: ["Deepcommon", "Dwarvish", "Gnomish", "Goblin", "Kobold"],
    infravision: 90,
    saveBonus: { ability: "Resilience", against: `paralysis, ${RESILIENCE}` },
  },
  {
    name: "Dwarf",
    requirements: { con: 9 },
    modifiers: { con: 1, cha: -1 },
    maxLevels: { Assassin: 9, Cleric: 8, Fighter: 10, Thief: 9 },
    npcOnly: ["Cleric"],
    languages: ["Dwarvish", "Gnomish", "Goblin", "Kobold"],
    infravision: 60,
    saveBonus: { ability: "Resilience", against: RESILIENCE },
  },
  {
    name: "Elf",
    requirements: { int: 9 },
    modifiers: { dex: 1, con: -1 },
    maxLevels: {
      Acrobat: 10,
      Assassin: 10,
      Cleric: 7,
      Druid: 8,
      Fighter: 7,
      Knight: 11,
      "Magic-User": 11,
      Ranger: 11,
      Thief: 10,
    },
    npcOnly: ["Cleric", "Druid"],
    languages: ["Elvish", "Gnoll", "Hobgoblin", "Orcish"],
    infravision: 60,
  },
  {
    name: "Gnome",
    requirements: { con: 9, int: 9 },
    modifiers: {},
    maxLevels: {
      Assassin: 6,
      Cleric: 7,
      Fighter: 6,
      Illusionist: 7,
      Thief: 8,
    },
    npcOnly: ["Cleric"],
    languages: ["Dwarvish", "Gnomish", "Kobold", "Burrowing mammals"],
    infravision: 90,
    saveBonus: { ability: "Magic Resistance", against: "spells, wands" },
  },
  {
    name: "Half-Elf",
    requirements: { cha: 9, con: 9 },
    modifiers: {},
    maxLevels: {
      Acrobat: 12,
      Assassin: 11,
      Bard: 12,
      Cleric: 5,
      Druid: 12,
      Fighter: 8,
      Knight: 12,
      "Magic-User": 8,
      Paladin: 12,
      Ranger: 8,
      Thief: 12,
    },
    npcOnly: [],
    languages: ["Elvish"],
    infravision: 60,
  },
  {
    name: "Halfling",
    requirements: { con: 9, dex: 9 },
    modifiers: { dex: 1, str: -1 },
    maxLevels: { Druid: 6, Fighter: 6, Thief: 8 },
    npcOnly: ["Druid"],
    languages: ["Halfling"],
    saveBonus: { ability: "Resilience", against: RESILIENCE },
  },
  {
    name: "Half-Orc",
    requirements: {},
    modifiers: { str: 1, con: 1, cha: -2 },
    maxLevels: { Acrobat: 8, Assassin: 8, Cleric: 4, Fighter: 10, Thief: 8 },
    npcOnly: [],
    languages: ["Orcish"],
    infravision: 60,
  },
  {
    name: "Svirfneblin",
    requirements: { con: 9 },
    modifiers: {},
    maxLevels: {
      Assassin: 8,
      Cleric: 7,
      Fighter: 6,
      Illusionist: 7,
      Thief: 8,
    },
    npcOnly: ["Cleric"],
    languages: [
      "Deepcommon",
      "Gnomish",
      "Dwarvish",
      "Kobold",
      "Earth elementals",
    ],
    infravision: 90,
    saveBonus: {
      ability: "Illusion Resistance",
      against: "illusions",
      bonus: 2,
    },
  },
];

export const CON_SAVE_BONUS = [
  { min: 3, max: 6, bonus: 0 },
  { min: 7, max: 10, bonus: 2 },
  { min: 11, max: 14, bonus: 3 },
  { min: 15, max: 17, bonus: 4 },
  { min: 18, max: 18, bonus: 5 },
];

export const RACIAL_ABILITY_VALUES: Record<string, string> = {
  "Blend into Stone": "4-in-6 / 2-in-6",
  "Blend into Stone (Gloomy)": "4-in-6",
  "Blend into Stone (Well-Lit)": "2-in-6",
  Combat: "small weapons",
  "Defensive Bonus": "+2 AC vs large",
  "Detect Construction Tricks": "2-in-6",
  "Detect Room Traps": "2-in-6",
  "Detect Secret Doors": "2-in-6",
  "Illusion Resistance": "+2 vs illusions",
  "Initiative Bonus (Optional Rule)": "+1 initiative",
  "Light Sensitivity": "−2 hit, −1 AC",
  "Listening at Doors": "2-in-6",
  "Missile Attack Bonus": "+1 missile",
  Stealth: "3-in-6",
};
