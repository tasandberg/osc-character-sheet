export const CREATION_STEPS = [
  "scores",
  "class",
  "details",
  "gear",
  "review",
] as const;
export type CreationStep = (typeof CREATION_STEPS)[number];

export const STEP_LABELS: Record<CreationStep, string> = {
  scores: "Scores",
  class: "Class",
  details: "Details",
  gear: "Gear",
  review: "Review",
};

export type StepStatus = { complete: boolean; blockedReason?: string };
export type StepStatuses = Record<CreationStep, StepStatus>;

export type StepPhase = "done" | "current" | "todo";

export function isCreationStep(value: unknown): value is CreationStep {
  return (CREATION_STEPS as readonly unknown[]).includes(value);
}

export function stepPhase(
  step: CreationStep,
  current: CreationStep,
  statuses: StepStatuses,
): StepPhase {
  if (step === current) return "current";
  return statuses[step].complete ? "done" : "todo";
}

export function firstIncompleteStep(statuses: StepStatuses): CreationStep {
  return CREATION_STEPS.find((step) => !statuses[step].complete) ?? "review";
}

export function adjacentStep(
  step: CreationStep,
  offset: 1 | -1,
): CreationStep | undefined {
  return CREATION_STEPS[CREATION_STEPS.indexOf(step) + offset];
}
