import {
  ABILITIES,
  ABILITY_NAMES,
  isInvalidManualScore,
  type Ability,
  type AbilityScores,
  type ScoresDraft,
} from "./scoresDraft";
import { ScoreGrid, ScoreTile } from "./ScoreTile";
import { formatModifier, scoreFaceClass } from "./scoreFace";

type Props = {
  draft: ScoresDraft;
  mods: AbilityScores;
  onEnter: (ability: Ability, text: string) => void;
};

export function ManualScores({ draft, mods, onEnter }: Props) {
  return (
    <>
      <section className="u-stack u-gap-4">
        <div className="vm-sheet-head">
          <h2 className="vm-sheet-head-title">Ability Scores</h2>
          <span className="vm-sheet-head-hint">type each score, 3 to 18</span>
        </div>
        <ScoreGrid>
          {ABILITIES.map((ability) => {
            const invalid = isInvalidManualScore(draft.manual[ability]);
            const errorId = `osc-creation-score-error-${ability}`;
            return (
              <ScoreTile
                key={ability}
                ability={ability}
                face={
                  <span
                    className={scoreFaceClass(
                      invalid && "vm-score-face-invalid",
                    )}
                  >
                    <input
                      className="vm-score-figure vm-score-input"
                      type="text"
                      inputMode="numeric"
                      aria-label={ABILITY_NAMES[ability]}
                      placeholder="—"
                      value={draft.manual[ability] ?? ""}
                      aria-invalid={invalid || undefined}
                      aria-describedby={invalid ? errorId : undefined}
                      onChange={(event) => onEnter(ability, event.target.value)}
                    />
                    {mods[ability] !== undefined && (
                      <span className="vm-score-mod">
                        {formatModifier(mods[ability])}
                      </span>
                    )}
                  </span>
                }
                footer={
                  invalid ? (
                    <span
                      className="vm-field-error tw:text-center"
                      id={errorId}
                    >
                      Scores run 3 to 18
                    </span>
                  ) : undefined
                }
              />
            );
          })}
        </ScoreGrid>
      </section>
      <section className="u-stack u-gap-2">
        <h3 className="vm-heading vm-heading-sm">Rolling at the table?</h3>
        <p className="vm-help">
          Roll 3d6 per score the way your referee asks, then type the totals.
          Modifiers and class requirements work from these numbers.
        </p>
      </section>
    </>
  );
}
