import {
  ABILITIES,
  abbreviation,
  nextInOrder,
  type Ability,
  type AbilityScores,
  type ScoresDraft,
} from "./scoresDraft";
import { DiceRow, ScoreFigure, ScoreGrid, ScoreTile } from "./ScoreTile";
import { scoreFaceClass } from "./scoreFace";

type Props = {
  draft: ScoresDraft;
  mods: AbilityScores;
  rolling: boolean;
  onRoll: (abilities: Ability[]) => void;
};

export function InOrderScores({ draft, mods, rolling, onRoll }: Props) {
  const next = nextInOrder(draft);
  const remaining = ABILITIES.filter((ability) => !draft.inOrder[ability]);
  const previous = (ability: Ability) =>
    abbreviation(ABILITIES[ABILITIES.indexOf(ability) - 1]);

  return (
    <section className="u-stack u-gap-4">
      <div className="vm-sheet-head">
        <h2 className="vm-sheet-head-title">Ability Scores</h2>
        <span className="vm-sheet-head-hint">rolled in order, STR to CHA</span>
      </div>
      <ScoreGrid>
        {ABILITIES.map((ability) => {
          const rolled = draft.inOrder[ability];
          return (
            <ScoreTile
              key={ability}
              ability={ability}
              face={
                rolled ? (
                  <span className={scoreFaceClass()}>
                    <ScoreFigure value={rolled.total} mod={mods[ability]} />
                  </span>
                ) : (
                  <span className={scoreFaceClass("vm-score-face-empty")}>
                    {ability === next ? (
                      <button
                        type="button"
                        className="vm-btn vm-btn-link"
                        aria-label={`Roll ${abbreviation(ability)}`}
                        aria-disabled={rolling}
                        onClick={() => !rolling && onRoll([ability])}
                      >
                        Roll
                      </button>
                    ) : (
                      <span
                        className="vm-score-placeholder"
                        aria-label={`${abbreviation(ability)} rolls after ${previous(ability)}`}
                      >
                        —
                      </span>
                    )}
                  </span>
                )
              }
              dice={<DiceRow dice={rolled?.dice} />}
            />
          );
        })}
      </ScoreGrid>
      {remaining.length > 0 && (
        <div className="u-row u-gap-4">
          <button
            type="button"
            className="vm-btn vm-btn-primary vm-btn-sm"
            aria-disabled={rolling}
            onClick={() => !rolling && onRoll(remaining)}
          >
            {remaining.length === ABILITIES.length
              ? "Roll all six"
              : `Roll remaining ${remaining.length}`}
          </button>
          <span className="vm-help vm-mono">
            {remaining.length === ABILITIES.length
              ? "3d6 for each score, kept as they fall"
              : `Fills ${remaining.map(abbreviation).join(", ")} in order`}
          </span>
        </div>
      )}
    </section>
  );
}
