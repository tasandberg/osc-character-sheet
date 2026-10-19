import { cx } from "@ui/cx";
import {
  STEP_LABELS,
  stepPhase,
  type CreationStep,
  type StepStatuses,
} from "./steps";

type Props = {
  steps: readonly CreationStep[];
  current: CreationStep;
  statuses: StepStatuses;
  summary: (step: CreationStep) => string | undefined;
  onSelect: (step: CreationStep) => void;
};

export function StepsNav({
  steps,
  current,
  statuses,
  summary,
  onSelect,
}: Props) {
  return (
    <nav aria-label="Creation steps" className="osc-creation-steps-nav">
      <ol className="vm-steps">
        {steps.map((step, index) => {
          const phase = stepPhase(step, current, statuses);
          const stepSummary = phase === "done" ? summary(step) : undefined;
          const content = (
            <>
              <span
                className={cx(
                  "vm-step-num",
                  phase === "done" && "vm-step-num-done",
                  phase === "current" && "vm-step-num-current",
                )}
              >
                {index + 1}
              </span>
              <span className="osc-creation-step-label">
                <span className="vm-heading vm-heading-sm">
                  {STEP_LABELS[step]}
                </span>
                {stepSummary && (
                  <small className="osc-creation-step-summary vm-mono u-fs-2xs u-text-dim">
                    {stepSummary}
                  </small>
                )}
              </span>
            </>
          );
          return (
            <li key={step}>
              {phase === "done" ? (
                <button
                  type="button"
                  className="osc-creation-step osc-creation-step-done u-row u-gap-3"
                  onClick={() => onSelect(step)}
                >
                  {content}
                </button>
              ) : (
                <span
                  className={cx(
                    "osc-creation-step u-row u-gap-3",
                    `osc-creation-step-${phase}`,
                  )}
                  aria-current={phase === "current" ? "step" : undefined}
                >
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
