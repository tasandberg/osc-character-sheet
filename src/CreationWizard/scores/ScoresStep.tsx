import { useEffect, useMemo, useState } from "react";
import { cx } from "@ui/cx";
import { VellumSegmented } from "@features/settings/controls";
import type { CreationRules } from "../rules";
import { ArrangeScores } from "./ArrangeScores";
import { InOrderScores } from "./InOrderScores";
import { ManualScores } from "./ManualScores";
import { RollMethodsButton, RollMethodsModal } from "./RollMethods";
import { ScoresAside } from "./ScoresAside";
import {
  ABILITY_NAMES,
  emptyScoresDraft,
  finalScores,
  scoresComplete,
  chooseScoreMethod,
  scoreChoiceId,
  scoreChoiceLabel,
  type RolledScore,
  type ScoreChoice,
  type ScoresDraft,
} from "./scoresDraft";

const helpFor = (method: ScoreChoice) =>
  method === "manual"
    ? "Type in scores rolled at the table, 3 to 18."
    : method.arrange
      ? `Roll ${method.formula} six times, then place the totals where you like.`
      : `Roll ${method.formula} per score, STR to CHA, kept as they fall.`;

type Props = {
  draft: ScoresDraft;
  rules: CreationRules;
  onChange: (update: (draft: ScoresDraft) => ScoresDraft) => void;
};

export function ScoresStep({ draft, rules, onChange }: Props) {
  const [rolling, setRolling] = useState(false);
  const [settingsHost, setSettingsHost] = useState<Element | null>(null);
  const scores = useMemo(() => finalScores(draft), [draft]);
  const mods = useMemo(() => rules.modifiers(scores), [rules, scores]);
  const choice = rules.scoreMethods.length > 1;
  const separate = rules.races.length > 0 && rules.raceMode === "separate";
  const { method } = draft;
  const offered = rules.scoreMethods.some(
    (other) => scoreChoiceId(other) === scoreChoiceId(method),
  );
  const fallback = rules.scoreMethods[0];
  useEffect(() => {
    if (!offered) onChange(() => emptyScoresDraft(fallback));
  }, [offered, fallback, onChange]);
  const choose = (id: string) => {
    const next = rules.scoreMethods.find(
      (other) => scoreChoiceId(other) === id,
    );
    if (next) onChange((d) => chooseScoreMethod(d, next));
  };

  const rollEach = async <K,>(
    keys: K[],
    label: (key: K) => string,
    apply: (draft: ScoresDraft, key: K, roll: RolledScore) => ScoresDraft,
  ) => {
    setRolling(true);
    try {
      for (const key of keys) {
        const roll = await rules.rollScore(label(key), draft.formula);
        onChange((d) => apply(d, key, roll));
      }
    } finally {
      setRolling(false);
    }
  };

  return (
    <div className="osc-creation-split">
      <div className="osc-creation-pane">
        <div className="u-stack u-gap-2">
          <div className="vm-sheet-head">
            <h2
              className={cx(
                "vm-sheet-head-title",
                !scoresComplete(draft) && "u-text-brass",
              )}
            >
              Roll Ability Scores
            </h2>
            {!choice && (
              <>
                <span className="vm-sheet-head-hint">
                  {scoreChoiceLabel(method)}
                </span>
                <RollMethodsButton onOpen={setSettingsHost} />
              </>
            )}
          </div>
          <div className="u-stack u-gap-2">
            {choice && (
              <div className="u-row u-gap-2">
                <div className="osc-creation-method-chooser">
                  <VellumSegmented
                    label="Roll method"
                    options={rules.scoreMethods.map((other) => ({
                      value: scoreChoiceId(other),
                      label: scoreChoiceLabel(other),
                    }))}
                    value={scoreChoiceId(method)}
                    onChange={choose}
                  />
                </div>
                <RollMethodsButton onOpen={setSettingsHost} />
              </div>
            )}
            <span className="vm-help">{helpFor(method)}</span>
          </div>
          <RollMethodsModal
            host={settingsHost}
            onClose={() => setSettingsHost(null)}
          />
        </div>
        {method === "manual" ? (
          <ManualScores
            draft={draft}
            mods={mods}
            onEnter={(ability, text) =>
              onChange((d) => ({
                ...d,
                manual: { ...d.manual, [ability]: text },
              }))
            }
          />
        ) : !method.arrange ? (
          <InOrderScores
            draft={draft}
            mods={mods}
            rolling={rolling}
            onRoll={(abilities) =>
              rollEach(
                abilities,
                (ability) => ABILITY_NAMES[ability],
                (d, ability, roll) =>
                  d.inOrder[ability]
                    ? d
                    : { ...d, inOrder: { ...d.inOrder, [ability]: roll } },
              )
            }
          />
        ) : (
          <ArrangeScores
            draft={draft}
            mods={mods}
            rolling={rolling}
            onRoll={(slots) =>
              rollEach(
                slots,
                (slot) => `Ability roll ${slot + 1} of 6`,
                (d, slot, roll) =>
                  d.pool[slot]
                    ? d
                    : {
                        ...d,
                        pool: d.pool.map((r, i) => (i === slot ? roll : r)),
                      },
              )
            }
            onPlace={(placed) => onChange((d) => ({ ...d, placed }))}
          />
        )}
      </div>
      <ScoresAside
        races={separate ? rules.races : []}
        classes={
          separate
            ? rules.classes.filter((cls) => !cls.demihuman)
            : rules.classes
        }
        scores={scores}
        xpBonus={rules.xpBonus}
      />
    </div>
  );
}
