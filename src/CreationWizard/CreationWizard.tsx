import type { DraftStore } from "./draftStore";
import { placeholderFlow } from "./flow";
import type { HouseRule } from "./houseRuleSettings";
import { PlaceholderStep } from "./PlaceholderStep";
import { useWizard } from "./useWizard";
import { WizardShell } from "./WizardShell";

type Props = {
  worldName: string;
  houseRules: HouseRule[];
  store: DraftStore;
  onCancel: () => void;
};

export function CreationWizard({
  worldName,
  houseRules,
  store,
  onCancel,
}: Props) {
  const wizard = useWizard(placeholderFlow, store);
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
      onCancel={onCancel}
    >
      <PlaceholderStep
        step={step}
        done={done}
        onToggleDone={() =>
          wizard.setDraft((d) => ({
            done: done ? d.done.filter((s) => s !== step) : [...d.done, step],
          }))
        }
      />
    </WizardShell>
  );
}
