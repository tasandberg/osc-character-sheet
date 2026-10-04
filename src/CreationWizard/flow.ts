import {
  CREATION_STEPS,
  STEP_LABELS,
  type CreationStep,
  type StepStatuses,
} from "./steps";

export interface CreationFlow<D> {
  emptyDraft(): D;
  parseDraft(raw: unknown): D | undefined;
  status(draft: D): StepStatuses;
  summary(draft: D, step: CreationStep): string | undefined;
}

export type PlaceholderDraft = { done: CreationStep[] };

export const placeholderFlow: CreationFlow<PlaceholderDraft> = {
  emptyDraft: () => ({ done: [] }),
  parseDraft: (raw) => {
    const done = (raw as Partial<PlaceholderDraft> | null)?.done;
    return Array.isArray(done)
      ? { done: done.filter((step) => CREATION_STEPS.includes(step)) }
      : undefined;
  },
  status: ({ done }) => {
    const ready = CREATION_STEPS.filter((step) => step !== "review").every(
      (step) => done.includes(step),
    );
    return Object.fromEntries(
      CREATION_STEPS.map((step) => {
        const complete = step === "review" ? ready : done.includes(step);
        const blockedReason =
          step === "review"
            ? "Finish every step to create the character"
            : `Mark ${STEP_LABELS[step]} done to continue`;
        return [step, complete ? { complete } : { complete, blockedReason }];
      }),
    ) as StepStatuses;
  },
  summary: () => undefined,
};
