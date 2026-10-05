import { useState } from "react";
import { ConfirmDialog } from "@ui/ConfirmDialog";
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
  onClose: () => void;
};

export function CreationWizard({
  worldName,
  houseRules,
  store,
  onClose,
}: Props) {
  const wizard = useWizard(placeholderFlow, store);
  const { step, draft } = wizard;
  const done = draft.done.includes(step);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

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
      onCancel={() => setConfirmingDiscard(true)}
      overlay={
        <ConfirmDialog
          open={confirmingDiscard}
          title="Discard this character?"
          body="Your choices so far will be lost."
          confirmLabel="Discard"
          cancelLabel="Keep editing"
          variant="danger"
          onConfirm={() => {
            store.clear();
            onClose();
          }}
          onCancel={() => setConfirmingDiscard(false)}
        />
      }
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
