import { useMemo, useState, type ReactNode } from "react";
import { VellumSegmented } from "@features/settings/controls";
import { RACES, type RaceMode } from "../race/raceDraft";
import type { CreationRules } from "../rules";
import { ArrangeScores } from "./ArrangeScores";
import { ClassAside } from "./ClassAside";
import { InOrderScores } from "./InOrderScores";
import { ManualScores } from "./ManualScores";
import { RaceAside } from "./RaceAside";
import {
  ABILITY_NAMES,
  finalScores,
  type RolledScore,
  type ScoreMethod,
  type ScoresDraft,
} from "./scoresDraft";

const svgProps = {
  className: "vm-choice-card-icon",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const METHODS: {
  method: ScoreMethod;
  title: string;
  body: string;
  icon: ReactNode;
}[] = [
  {
    method: "inOrder",
    title: "3d6 in order",
    body: "STR to CHA, kept as they fall.",
    icon: (
      <svg {...svgProps}>
        <path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" />
        <path d="M12 7l4.5 8h-9z" />
      </svg>
    ),
  },
  {
    method: "arrange",
    title: "Roll and arrange",
    body: "Roll six totals, then place them where you like.",
    icon: (
      <svg {...svgProps}>
        <path d="M7 4v16M4 17l3 3 3-3M17 20V4M14 7l3-3 3 3" />
      </svg>
    ),
  },
  {
    method: "manual",
    title: "Enter manually",
    body: "Type in scores rolled at the table.",
    icon: (
      <svg {...svgProps}>
        <path d="M4 20l4-1 11-11-3-3L5 16z" />
      </svg>
    ),
  },
];

const QUESTION = "How will you roll ability scores?";

const RACE_MODES: { value: RaceMode; label: string }[] = [
  { value: "separate", label: "Separate" },
  { value: "asClass", label: "As class" },
];

function RaceModeSwitch({
  value,
  onChange,
}: {
  value: RaceMode;
  onChange: (mode: RaceMode) => void;
}) {
  return (
    <VellumSegmented
      label="How race is chosen"
      options={RACE_MODES}
      value={value}
      onChange={onChange}
      full
    />
  );
}

type Props = {
  draft: ScoresDraft;
  rules: CreationRules;
  worldName: string;
  raceMode: RaceMode;
  onRaceMode: (mode: RaceMode) => void;
  onChange: (update: (draft: ScoresDraft) => ScoresDraft) => void;
};

export function ScoresStep({
  draft,
  rules,
  worldName,
  raceMode,
  onRaceMode,
  onChange,
}: Props) {
  const [rolling, setRolling] = useState(false);
  const scores = useMemo(() => finalScores(draft), [draft]);
  const mods = useMemo(() => rules.modifiers(scores), [rules, scores]);

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
        <div className="u-stack u-gap-3">
          <div className="vm-sheet-head">
            <h2 className="vm-sheet-head-title">{QUESTION}</h2>
          </div>
          <div
            className="vm-choice-cards"
            role="radiogroup"
            aria-label={QUESTION}
          >
            <div className="vm-choice-cards-grid">
              {METHODS.map(({ method, title, body, icon }) => (
                <button
                  key={method}
                  type="button"
                  role="radio"
                  className="vm-choice-card vm-choice-card-compact"
                  aria-checked={draft.method === method}
                  onClick={() => onChange((d) => ({ ...d, method }))}
                >
                  {icon}
                  <span className="vm-choice-card-title">{title}</span>
                  <span className="vm-choice-card-mark" aria-hidden="true">
                    <span className="vm-choice-card-dot" />
                  </span>
                  <span className="vm-choice-card-body">{body}</span>
                </button>
              ))}
            </div>
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
      {rules.separateRaces && raceMode === "separate" ? (
        <RaceAside races={RACES} scores={scores}>
          <RaceModeSwitch value={raceMode} onChange={onRaceMode} />
          <p className="vm-help">
            {worldName} allows Advanced Fantasy races. Pick a race in its own
            step, then a class it allows.
          </p>
        </RaceAside>
      ) : (
        <ClassAside classes={rules.classes} scores={scores}>
          {rules.separateRaces && (
            <RaceModeSwitch value={raceMode} onChange={onRaceMode} />
          )}
        </ClassAside>
      )}
    </div>
  );
}
