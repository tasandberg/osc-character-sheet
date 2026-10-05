import { useRef, type ReactNode } from "react";
import { HouseRules } from "./HouseRules";
import type { HouseRule } from "./houseRuleSettings";
import { StepsNav } from "./StepsNav";
import { STEP_LABELS, type CreationStep, type StepStatuses } from "./steps";
import { useScrollsFurther } from "./useScrollsFurther";

type Props = {
  worldName: string;
  houseRules: HouseRule[];
  step: CreationStep;
  statuses: StepStatuses;
  next?: CreationStep;
  summary: (step: CreationStep) => string | undefined;
  onSelectStep: (step: CreationStep) => void;
  onNext: () => void;
  onBack?: () => void;
  onCreate?: () => void;
  children: ReactNode;
};

export function WizardShell({
  worldName,
  houseRules,
  step,
  statuses,
  next,
  summary,
  onSelectStep,
  onNext,
  onBack,
  onCreate,
  children,
}: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollsFurther = useScrollsFurther(bodyRef, step);
  const status = statuses[step];
  const canAdvance =
    status.complete && (next !== undefined || onCreate !== undefined);
  const help = status.complete ? undefined : status.blockedReason;

  return (
    <div className="osc-sheet-app osc-creation-wizard-app vm-paper">
      <header className="u-flex-none u-px-5 u-pt-2">
        <div className="osc-creation-top u-row u-gap-4 u-pb-1">
          <span className="osc-creation-crumb vm-heading vm-heading-sm u-text-brass">
            {worldName}
          </span>
          <HouseRules worldName={worldName} rules={houseRules} />
        </div>
        <StepsNav
          current={step}
          statuses={statuses}
          summary={summary}
          onSelect={onSelectStep}
        />
      </header>
      <div ref={bodyRef} className="osc-creation-body u-px-5 u-py-3">
        <div>{children}</div>
        {scrollsFurther && (
          <div className="osc-creation-more-below">
            <button
              type="button"
              className="vm-btn vm-btn-secondary"
              onClick={() =>
                bodyRef.current?.scrollBy({
                  top: bodyRef.current.clientHeight * 0.8,
                  behavior: "smooth",
                })
              }
            >
              More below
              <i className="fa-solid fa-chevron-down" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <footer className="osc-creation-footer u-row u-gap-3 tw:mx-5 u-pt-3 u-pb-4">
        {onBack && (
          <button
            type="button"
            className="vm-btn vm-btn-secondary vm-btn-lg"
            onClick={onBack}
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            Back
          </button>
        )}
        <span className="u-flex-1" />
        {help && <span className="vm-help">{help}</span>}
        <button
          type="button"
          className="vm-btn vm-btn-primary"
          aria-disabled={!canAdvance}
          onClick={() => {
            if (!canAdvance) return;
            if (next) onNext();
            else onCreate?.();
          }}
        >
          {next ? `Next: ${STEP_LABELS[next]}` : "Create Character"}
          {next && (
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          )}
        </button>
      </footer>
    </div>
  );
}
