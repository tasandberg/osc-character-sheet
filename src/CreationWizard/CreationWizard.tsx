import { useEffect, useMemo } from "react";
import { ClassStep } from "./class/ClassStep";
import { DetailsStep } from "./details/DetailsStep";
import {
  chosenRace,
  classDetails,
  classRestrictions,
  classScores,
  creationFlow,
} from "./flow";
import { GearFooter } from "./gear/GearFooter";
import { GearStep } from "./gear/GearStep";
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
  onTitle?: (title: string) => void;
};

export function CreationWizard({
  worldName,
  houseRules,
  rules,
  onTitle,
}: Props) {
  const flow = useMemo(() => creationFlow(rules), [rules]);
  const wizard = useWizard(flow);
  const { step, draft } = wizard;
  const done = draft.done.includes(step);
  const scores = useMemo(() => finalScores(draft.scores), [draft.scores]);
  const race = chosenRace(draft);
  const details = classDetails(draft, rules);
  const name = draft.details.name.trim();
  useEffect(() => {
    onTitle?.(name ? `New Character: ${name}` : "New Character");
  }, [name, onTitle]);

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
      stats={step === "gear" && <GearFooter draft={draft.gear} rules={rules} />}
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
      ) : step === "details" && draft.class && details ? (
        <DetailsStep
          draft={draft.details}
          details={details}
          cls={draft.class}
          race={race}
          scores={classScores(draft)}
          rules={rules}
          onChange={(update) =>
            wizard.setDraft((d) => ({ ...d, details: update(d.details) }))
          }
        />
      ) : step === "gear" ? (
        <GearStep
          draft={draft.gear}
          rules={rules}
          onChange={(update) =>
            wizard.setDraft((d) => ({ ...d, gear: update(d.gear) }))
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
