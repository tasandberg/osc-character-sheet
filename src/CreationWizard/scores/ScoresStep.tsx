import { useMemo, useState } from "react";
import { VellumSegmented } from "@features/settings/controls";
import type { CreationRules } from "../rules";
import { ArrangeScores } from "./ArrangeScores";
import { InOrderScores } from "./InOrderScores";
import { ManualScores } from "./ManualScores";
import { ScoresAside } from "./ScoresAside";
import {
  ABILITY_NAMES,
  finalScores,
  type RolledScore,
  type ScoreMethod,
  type ScoresDraft,
} from "./scoresDraft";

const METHODS: Record<ScoreMethod, { title: string; help: string }> = {
  inOrder: {
    title: "3d6 in order",
    help: "STR to CHA, kept as they fall, a.k.a. 3d6 down the line.",
  },
  arrange: {
    title: "Roll and arrange",
    help: "Roll six totals, then place them where you like.",
  },
  manual: {
    title: "Enter manually",
    help: "Type in scores rolled at the table, 3 to 18.",
  },
};

type Props = {
  draft: ScoresDraft;
  rules: CreationRules;
  onChange: (update: (draft: ScoresDraft) => ScoresDraft) => void;
};

export function ScoresStep({ draft, rules, onChange }: Props) {
  const [rolling, setRolling] = useState(false);
  const scores = useMemo(() => finalScores(draft), [draft]);
  const mods = useMemo(() => rules.modifiers(scores), [rules, scores]);
  const choice = rules.scoreMethods.length > 1;
  const separate = rules.races.length > 0 && rules.raceMode === "separate";

  const rollEach = async <K,>(
    keys: K[],
    label: (key: K) => string,
    apply: (draft: ScoresDraft, key: K, roll: RolledScore) => ScoresDraft,
  ) => {
    setRolling(true);
    try {
      for (const key of keys) {
        const roll = await rules.rollScore(label(key));
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
            <h2 className="vm-sheet-head-title">Roll Ability Scores</h2>
            {!choice && (
              <span className="vm-sheet-head-hint">
                {METHODS[draft.method].title}
              </span>
            )}
          </div>
          <div className="u-stack u-gap-2">
            {choice && (
              <div className="osc-creation-method-chooser">
                <VellumSegmented
                  label="Roll method"
                  options={rules.scoreMethods.map((method) => ({
                    value: method,
                    label: METHODS[method].title,
                  }))}
                  value={draft.method}
                  onChange={(method) => onChange((d) => ({ ...d, method }))}
                />
              </div>
            )}
            <span className="vm-help">{METHODS[draft.method].help}</span>
          </div>
        </div>
        {draft.method === "inOrder" ? (
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
        ) : draft.method === "arrange" ? (
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
        ) : (
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
