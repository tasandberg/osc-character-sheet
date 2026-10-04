import { cx } from "@ui/cx";
import {
  CREATION_STEPS,
  STEP_LABELS,
  stepPhase,
  type CreationStep,
  type StepStatuses,
} from "./steps";

type Props = {
  current: CreationStep;
  statuses: StepStatuses;
  summary: (step: CreationStep) => string | undefined;
  onSelect: (step: CreationStep) => void;
};

export function StepsNav({ current, statuses, summary, onSelect }: Props) {
  return (
    <nav aria-label="Creation steps" className="osc-creation-steps-nav">
      <ol className="vm-steps">
        {CREATION_STEPS.map((step, index) => {
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
              <span className="u-flex tw:flex-col u-gap-1 u-items-start">
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
