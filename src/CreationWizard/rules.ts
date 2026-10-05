import type { ClassRequirements } from "./scores/classStanding";
import type { AbilityScores, RolledScore } from "./scores/scoresDraft";

export type CreationRules = {
  classes: ClassRequirements[];
  modifiers(scores: AbilityScores): AbilityScores;
  rollScore(label: string): Promise<RolledScore>;
};
