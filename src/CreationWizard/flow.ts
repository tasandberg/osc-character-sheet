import { classBlockedReason, classSummary } from "./class/classDraft";
import {
  characterDetails,
  detailsBlockedReason,
  detailsSummary,
  emptyDetailsDraft,
  type DetailsDraft,
} from "./details/detailsDraft";
import {
  adjustedScores,
  raceBlockedReason,
  raceRestrictions,
  raceSummary,
  type CreationRace,
  type RaceMode,
} from "./race/raceDraft";
import {
  emptyGearDraft,
  gearBlockedReason,
  gearSummary,
  type GearDraft,
} from "./gear/gearDraft";
import type { CreationClass, CreationRules } from "./rules";
import {
  emptyScoresDraft,
  finalScores,
  scoresBlockedReason,
  scoresSummary,
  type ScoresDraft,
} from "./scores/scoresDraft";
import {
  CREATION_STEPS,
  STEP_LABELS,
  type CreationStep,
  type StepStatuses,
} from "./steps";

export interface CreationFlow<D> {
  emptyDraft(): D;
  steps(draft: D): readonly CreationStep[];
  status(draft: D): StepStatuses;
  summary(draft: D, step: CreationStep): string | undefined;
}

export type CreationDraft = {
  scores: ScoresDraft;
  raceMode: RaceMode;
  race?: CreationRace;
  class?: CreationClass;
  details: DetailsDraft;
  gear: GearDraft;
  done: CreationStep[];
};

export type FlowRules = Pick<
  CreationRules,
  | "separateRaces"
  | "modifiers"
  | "maxHitPointsAtFirstLevel"
  | "maximumHitPoints"
>;

const CLASS_ONLY_STEPS = CREATION_STEPS.filter((step) => step !== "race");

export const chosenRace = (draft: CreationDraft) =>
  draft.raceMode === "separate" ? draft.race : undefined;

export const classScores = (draft: CreationDraft) =>
  adjustedScores(finalScores(draft.scores), chosenRace(draft));

export const classRestrictions = (draft: CreationDraft) => {
  const race = chosenRace(draft);
  return race && raceRestrictions(race);
};

export const classDetails = (draft: CreationDraft, rules: FlowRules) =>
  draft.class &&
  characterDetails({
    draft: draft.details,
    cls: draft.class,
    restrictions: classRestrictions(draft),
    conMod: rules.modifiers(classScores(draft)).con ?? 0,
    maximum: rules.maxHitPointsAtFirstLevel
      ? rules.maximumHitPoints
      : undefined,
  });

const steps = (draft: CreationDraft) =>
  draft.raceMode === "separate" ? CREATION_STEPS : CLASS_ONLY_STEPS;

function blockedReason(
  draft: CreationDraft,
  step: CreationStep,
  rules: FlowRules,
): string | undefined {
  if (step === "scores") return scoresBlockedReason(draft.scores);
  if (step === "race")
    return raceBlockedReason(draft.race, finalScores(draft.scores));
  if (step === "class")
    return classBlockedReason(
      draft.class,
      classScores(draft),
      classRestrictions(draft),
    );
  if (step === "details") {
    const details = classDetails(draft, rules);
    return details
      ? detailsBlockedReason(draft.details, details)
      : "Choose a class to continue";
  }
  if (step === "gear") return gearBlockedReason(draft.gear);
  if (step === "review")
    return steps(draft).every(
      (s) => s === "review" || !blockedReason(draft, s, rules),
    )
      ? undefined
      : "Finish every step to create the character";
  return draft.done.includes(step)
    ? undefined
    : `Mark ${STEP_LABELS[step]} done to continue`;
}

export const creationFlow = (
  rules: FlowRules,
): CreationFlow<CreationDraft> => ({
  emptyDraft: () => ({
    scores: emptyScoresDraft(),
    raceMode: rules.separateRaces ? "separate" : "asClass",
    details: emptyDetailsDraft(),
    gear: emptyGearDraft(),
    done: [],
  }),
  steps,
  status: (draft) =>
    Object.fromEntries(
      CREATION_STEPS.map((step) => {
        const reason = blockedReason(draft, step, rules);
        return [
          step,
          reason
            ? { complete: false, blockedReason: reason }
            : { complete: true },
        ];
      }),
    ) as StepStatuses,
  summary: (draft, step) => {
    if (step === "details") {
      const details = classDetails(draft, rules);
      return details && detailsSummary(draft.details, details);
    }
    if (step === "gear") return gearSummary(draft.gear);
    return step === "scores"
      ? scoresSummary(draft.scores)
      : step === "race"
        ? raceSummary(draft.race, finalScores(draft.scores))
        : step === "class"
          ? classSummary(
              draft.class,
              classScores(draft),
              classRestrictions(draft),
              chosenRace(draft)?.name,
            )
          : undefined;
  },
});
