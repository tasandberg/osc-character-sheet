import { useEffect, useMemo, useState } from "react";
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
import { RACES } from "./race/raceDraft";
import { RaceStep } from "./race/RaceStep";
import { newCharacter } from "./review/newCharacter";
import { ReviewStep } from "./review/ReviewStep";
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
  onCreated?: () => void;
};

export function CreationWizard({
  worldName,
  houseRules,
  rules,
  onTitle,
  onCreated,
}: Props) {
  const flow = useMemo(() => creationFlow(rules), [rules]);
  const wizard = useWizard(flow);
  const { step, draft } = wizard;
  const [creating, setCreating] = useState(false);
  const scores = useMemo(() => finalScores(draft.scores), [draft.scores]);
  const race = chosenRace(draft);
  const details = classDetails(draft, rules);
  const name = draft.details.name.trim();
  useEffect(() => {
    onTitle?.(name ? `New Character: ${name}` : "New Character");
  }, [name, onTitle]);

  const create = async () => {
    const character = newCharacter(draft, rules);
    if (creating || !character) return;
    setCreating(true);
    try {
      if (await rules.createCharacter(character)) onCreated?.();
    } finally {
      setCreating(false);
    }
  };

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
      onCreate={create}
      creating={creating}
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
        draft.class &&
        details && (
          <ReviewStep
            details={draft.details}
            character={details}
            cls={draft.class}
            race={race}
            scores={classScores(draft)}
            gear={draft.gear}
            rules={rules}
          />
        )
      )}
    </WizardShell>
  );
}
