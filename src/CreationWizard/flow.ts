import { classBlockedReason, classSummary } from "./class/classDraft";
import {
  adjustedScores,
  raceBlockedReason,
  raceRestrictions,
  raceSummary,
  type CreationRace,
  type RaceMode,
} from "./race/raceDraft";
import type { CreationClass } from "./rules";
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
  done: CreationStep[];
};

const CLASS_ONLY_STEPS = CREATION_STEPS.filter((step) => step !== "race");

export const chosenRace = (draft: CreationDraft) =>
  draft.raceMode === "separate" ? draft.race : undefined;

export const classScores = (draft: CreationDraft) =>
  adjustedScores(finalScores(draft.scores), chosenRace(draft));

export const classRestrictions = (draft: CreationDraft) => {
  const race = chosenRace(draft);
  return race && raceRestrictions(race);
};

const steps = (draft: CreationDraft) =>
  draft.raceMode === "separate" ? CREATION_STEPS : CLASS_ONLY_STEPS;

function blockedReason(
  draft: CreationDraft,
  step: CreationStep,
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
  if (step === "review")
    return steps(draft).every((s) => s === "review" || !blockedReason(draft, s))
      ? undefined
      : "Finish every step to create the character";
  return draft.done.includes(step)
    ? undefined
    : `Mark ${STEP_LABELS[step]} done to continue`;
}

export const creationFlow: CreationFlow<CreationDraft> = {
  emptyDraft: () => ({
    scores: emptyScoresDraft(),
    raceMode: "asClass",
    done: [],
  }),
  steps,
  status: (draft) =>
    Object.fromEntries(
      CREATION_STEPS.map((step) => {
        const reason = blockedReason(draft, step);
        return [
          step,
          reason
            ? { complete: false, blockedReason: reason }
            : { complete: true },
        ];
      }),
    ) as StepStatuses,
  summary: (draft, step) =>
    step === "scores"
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
          : undefined,
};
