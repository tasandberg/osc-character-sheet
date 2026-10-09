import type { LoadGearCatalog, PreviewLoad } from "./gear/gearTypes";
import type { PrimeRequisiteRules } from "./rules/xpAdjustment";
import type { ClassRequirements } from "./scores/classStanding";
import type { AbilityScores, RolledScore } from "./scores/scoresDraft";

export type ClassSkill = { key: string; chance: number };

export type ClassLevel = {
  xp: number;
  hd: string;
  thac0: number;
  saves: number[];
  spells?: number[];
};

export type CreationClass = ClassRequirements &
  PrimeRequisiteRules & {
    hitDie: string;
    thac0: number;
    nextLevelXp: number | null;
    skills: ClassSkill[];
    levels: ClassLevel[];
  };

export type ClassRestrictions = {
  allowed?: (className: string) => boolean;
  maxLevel?: (className: string) => number | undefined;
};

export type ClassAbility = { name: string; description: string };

export type ClassDetail = {
  description: string;
  armour?: string;
  weapons?: string;
  abilities: ClassAbility[];
  skillLabels: Record<string, string>;
};

export type RaceDetail = { description: string; abilities: ClassAbility[] };

export type Alignment = "lawful" | "neutral" | "chaotic";

export type AlignmentText = Partial<Record<Alignment, string>>;

export type CreationRules = {
  classes: CreationClass[];
  classDetail(name: string): Promise<ClassDetail>;
  separateRaces: boolean;
  raceDetail(name: string): Promise<RaceDetail>;
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
};
