import type { PrimeRequisiteRules } from "./rules/xpAdjustment";
import type { ClassRequirements } from "./scores/classStanding";
import type { AbilityScores, RolledScore } from "./scores/scoresDraft";

export type ClassSkill = { key: string; chance: number };

export type CreationClass = ClassRequirements &
  PrimeRequisiteRules & {
    hitDie: string;
    thac0: number;
    nextLevelXp: number | null;
    skills: ClassSkill[];
  };

export type ClassRestrictions = {
  allowed?: ReadonlySet<string>;
  maxLevel?: Readonly<Record<string, number>>;
};

export type ClassAbility = { name: string; description: string };

export type ClassDetail = {
  description: string;
  armour?: string;
  weapons?: string;
  abilities: ClassAbility[];
  skillLabels: Record<string, string>;
};

export type CreationRules = {
  classes: CreationClass[];
  classDetail(name: string): Promise<ClassDetail>;
  modifiers(scores: AbilityScores): AbilityScores;
  rollScore(label: string): Promise<RolledScore>;
};
