import { creationFlow } from "./flow";
import type { HouseRule } from "./houseRuleSettings";
import { PlaceholderStep } from "./PlaceholderStep";
import type { CreationRules } from "./rules";
import { ScoresStep } from "./scores/ScoresStep";
import { useWizard } from "./useWizard";
import { WizardShell } from "./WizardShell";

type Props = {
  worldName: string;
  houseRules: HouseRule[];
  rules: CreationRules;
};

export function CreationWizard({ worldName, houseRules, rules }: Props) {
  const wizard = useWizard(creationFlow);
  const { step, draft } = wizard;
  const done = draft.done.includes(step);

  return (
    <WizardShell
      worldName={worldName}
      houseRules={houseRules}
      step={step}
      statuses={wizard.statuses}
      next={wizard.next}
      summary={wizard.summary}
      onSelectStep={wizard.goTo}
      onNext={wizard.goNext}
      onBack={wizard.previous && wizard.goBack}
    >
      {step === "scores" ? (
        <ScoresStep
          draft={draft.scores}
          rules={rules}
          onChange={(update) =>
            wizard.setDraft((d) => ({ ...d, scores: update(d.scores) }))
          }
        />
      ) : (
        <PlaceholderStep
          step={step}
          done={done}
          onToggleDone={() =>
            wizard.setDraft((d) => ({
              ...d,
              done: done ? d.done.filter((s) => s !== step) : [...d.done, step],
            }))
          }
        />
      )}
    </WizardShell>
  );
}
