import type { Ability, AbilityScores } from "./scores/scoresDraft";

type Keyed = { key?: string; name: string };

export type SaveBonusGap = { ability: string; against: string; bonus?: number };

export type RaceGaps = {
  npcOnly: string[];
  infravision?: number;
  saveBonus?: SaveBonusGap;
};

export type SaveBonus = { bonus: number; summary: string; basis: string };

const RESILIENCE = "poison, spells, wands";

const RACE_GAPS: Record<string, RaceGaps> = {
  drow: { npcOnly: ["cleric"], infravision: 90 },
  duergar: {
    npcOnly: ["cleric"],
    infravision: 90,
    saveBonus: { ability: "Resilience", against: `paralysis, ${RESILIENCE}` },
  },
  dwarf: {
    npcOnly: ["cleric"],
    infravision: 60,
    saveBonus: { ability: "Resilience", against: RESILIENCE },
  },
  elf: { npcOnly: ["cleric", "druid"], infravision: 60 },
  gnome: {
    npcOnly: ["cleric"],
    infravision: 90,
    saveBonus: { ability: "Magic Resistance", against: "spells, wands" },
  },
  "half-elf": { npcOnly: [], infravision: 60 },
  halfling: {
    npcOnly: ["druid"],
    saveBonus: { ability: "Resilience", against: RESILIENCE },
  },
  "half-orc": { npcOnly: [], infravision: 60 },
  svirfneblin: {
    npcOnly: ["cleric"],
    infravision: 90,
    saveBonus: {
      ability: "Illusion Resistance",
      against: "illusions",
      bonus: 2,
    },
  },
};

const CLASS_REQUIREMENTS: Record<string, Partial<Record<Ability, number>>> = {
  dwarf: { con: 9 },
  elf: { int: 9 },
  halfling: { con: 9, dex: 9 },
};

const CON_SAVE_BONUS = [
  { min: 3, max: 6, bonus: 0 },
  { min: 7, max: 10, bonus: 2 },
  { min: 11, max: 14, bonus: 3 },
  { min: 15, max: 17, bonus: 4 },
  { min: 18, max: 18, bonus: 5 },
];

const NO_GAPS: RaceGaps = { npcOnly: [] };

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const itemKey = ({ key, name }: Keyed) => key || slug(name);

export const raceGaps = (race: Keyed): RaceGaps =>
  RACE_GAPS[itemKey(race)] ?? NO_GAPS;

export const classRequirementGaps = (cls: Keyed) =>
  CLASS_REQUIREMENTS[itemKey(cls)] ?? {};

export const isNpcOnly = (race: Keyed, cls: Keyed) =>
  raceGaps(race).npcOnly.includes(itemKey(cls));

export const infravision = (race: Keyed) => raceGaps(race).infravision;

export function raceSaveBonus(
  race: Keyed,
  scores: AbilityScores,
): SaveBonus | undefined {
  const save = raceGaps(race).saveBonus;
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
  race: Keyed,
  abilityName: string,
  scores: AbilityScores,
): string | undefined {
  const gaps = raceGaps(race);
  const name = slug(abilityName);
  if (name === "infravision" && gaps.infravision) return `${gaps.infravision}′`;
  if (gaps.saveBonus && name === slug(gaps.saveBonus.ability)) {
    const save = raceSaveBonus(race, scores);
    if (!save) return undefined;
    if (gaps.saveBonus.bonus !== undefined) return save.summary;
    return `${save.bonus ? `+${save.bonus}` : "No"} saves (CON ${scores.con})`;
  }
  return undefined;
}
