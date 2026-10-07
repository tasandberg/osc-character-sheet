import { classBlockedReason, classSummary } from "./class/classDraft";
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
  status(draft: D): StepStatuses;
  summary(draft: D, step: CreationStep): string | undefined;
}

export type CreationDraft = {
  scores: ScoresDraft;
  class?: CreationClass;
  done: CreationStep[];
};

function blockedReason(draft: CreationDraft, step: CreationStep) {
  if (step === "scores") return scoresBlockedReason(draft.scores);
  if (step === "class")
    return classBlockedReason(draft.class, finalScores(draft.scores));
  if (step === "review")
    return CREATION_STEPS.every(
      (s) => s === "review" || !blockedReason(draft, s),
    )
      ? undefined
      : "Finish every step to create the character";
  return draft.done.includes(step)
    ? undefined
    : `Mark ${STEP_LABELS[step]} done to continue`;
}

export const creationFlow: CreationFlow<CreationDraft> = {
  emptyDraft: () => ({ scores: emptyScoresDraft(), done: [] }),
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
      : step === "class"
        ? classSummary(draft.class, finalScores(draft.scores))
        : undefined,
};
