import { useMemo } from "react";
import { ClassStep } from "./class/ClassStep";
import {
  chosenRace,
  classRestrictions,
  classScores,
  creationFlow,
} from "./flow";
import type { HouseRule } from "./houseRuleSettings";
import { PlaceholderStep } from "./PlaceholderStep";
import { RACES } from "./race/raceDraft";
import { RaceStep } from "./race/RaceStep";
import type { CreationRules } from "./rules";
import { finalScores } from "./scores/scoresDraft";
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
  const scores = useMemo(() => finalScores(draft.scores), [draft.scores]);
  const race = chosenRace(draft);

  return (
    <WizardShell
      worldName={worldName}
      houseRules={houseRules}
      steps={wizard.steps}
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
          worldName={worldName}
          raceMode={draft.raceMode}
          onRaceMode={(raceMode) =>
            wizard.setDraft((d) => ({ ...d, raceMode }))
          }
          onChange={(update) =>
            wizard.setDraft((d) => ({ ...d, scores: update(d.scores) }))
          }
        />
      ) : step === "race" ? (
        <RaceStep
          races={RACES}
          scores={scores}
          chosen={draft.race}
          loadDetail={rules.raceDetail}
          onChoose={(choice) =>
            wizard.setDraft((d) => ({ ...d, race: choice }))
          }
        />
      ) : step === "class" ? (
        <ClassStep
          classes={rules.classes}
          scores={classScores(draft)}
          chosen={draft.class}
          race={race}
          restrictions={classRestrictions(draft)}
          loadDetail={rules.classDetail}
          onChoose={(cls) => wizard.setDraft((d) => ({ ...d, class: cls }))}
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
