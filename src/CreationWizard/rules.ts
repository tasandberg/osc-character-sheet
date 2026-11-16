import type { LoadGearCatalog, PreviewLoad } from "./gear/gearTypes";
import type { NewCharacter } from "./review/newCharacter";
import type { CreationRace } from "./race/raceItems";
import type { Ability, AbilityScores, RolledScore } from "./scores/scoresDraft";

export type ClassTable = {
  key: string;
  label: string;
  columns: { key: string; name?: string }[];
  legend?: { value: string; text: string }[];
  rows: Record<string, number | string>[];
};

export type CreationClass = {
  uuid: string;
  key: string;
  name: string;
  requirements: Partial<Record<Ability, number>>;
  primeRequisites: Ability[];
  hitDie: string;
  maxLevel: number;
  languages: string[];
  demihuman: boolean;
  casts: boolean;
  armour?: string;
  weapons?: string;
  tables: ClassTable[];
};

export type ClassStats = {
  xp: number;
  nextXp: number | null;
  hd: string;
  thac0: number;
  bba: number;
  saves: number[];
  spellSlots: number[];
  conLevels: number;
};

export type ClassRestrictions = {
  allowed?: (className: string) => boolean;
  maxLevel?: (className: string) => number | undefined;
};

export type ClassAbility = {
  name: string;
  description: string;
  level?: number;
};

export type ClassDetail = { description: string; abilities: ClassAbility[] };

export type RaceAbility = ClassAbility & { level: number };

export type RaceDetail = { description: string; abilities: RaceAbility[] };

export type Alignment = "lawful" | "neutral" | "chaotic";

export type AlignmentText = Partial<Record<Alignment, string>>;

export type CreationRules = {
  classes: CreationClass[];
  classDetail(uuid: string): Promise<ClassDetail>;
  classStats(cls: CreationClass, level: number): ClassStats;
  xpBonus(cls: CreationClass, scores: AbilityScores): number;
  races: CreationRace[];
  raceDetail(uuid: string): Promise<RaceDetail>;
  raceScores(scores: AbilityScores, race?: CreationRace): AbilityScores;
  modifiers(scores: AbilityScores): AbilityScores;
  rollScore(label: string): Promise<RolledScore>;
  maxHitPointsAtFirstLevel: boolean;
  maximumHitPoints(formula: string): number;
  rollHitPoints(formula: string, label: string): Promise<RolledScore>;
  alignmentText(): Promise<AlignmentText>;
  saveNames: string[];
  rollStartingGold(formula: string, label: string): Promise<RolledScore>;
  loadGearCatalog: LoadGearCatalog;
  previewLoad: PreviewLoad;
  openItemSheet(uuid: string): void;
  createCharacter(character: NewCharacter): Promise<boolean>;
};
