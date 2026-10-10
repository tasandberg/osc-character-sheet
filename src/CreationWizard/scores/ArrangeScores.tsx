import { useState } from "react";
import {
  ABILITIES,
  abbreviation,
  unplacedSlots,
  type Ability,
  type AbilityScores,
  type ScoresDraft,
} from "./scoresDraft";
import { ScoreFigure, ScoreGrid, ScoreTile } from "./ScoreTile";
import { scoreFaceClass } from "./scoreFace";

type Props = {
  draft: ScoresDraft;
  mods: AbilityScores;
  rolling: boolean;
  onRoll: (slots: number[]) => void;
  onPlace: (placed: ScoresDraft["placed"]) => void;
};

export function ArrangeScores({
  draft,
  mods,
  rolling,
  onRoll,
  onPlace,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const unplaced = unplacedSlots(draft);
  const selectedSlot =
    selected !== null && unplaced.includes(selected) ? selected : null;
  const selectedRoll = selectedSlot === null ? null : draft.pool[selectedSlot];
  const unrolled = draft.pool.flatMap((roll, slot) => (roll ? [] : [slot]));
  const empty = ABILITIES.filter((a) => draft.placed[a] === undefined);
  const anyRolled = unrolled.length < draft.pool.length;

  const place = (ability: Ability) => {
    if (selectedSlot === null) return;
    onPlace({ ...draft.placed, [ability]: selectedSlot });
    setSelected(null);
  };
  const unplace = (ability: Ability) => {
    onPlace(
      Object.fromEntries(
        Object.entries(draft.placed).filter(([key]) => key !== ability),
      ),
    );
  };
  const placeRestInOrder = () => {
    const placed = { ...draft.placed };
    empty.forEach((ability, i) => {
      if (unplaced[i] !== undefined) placed[ability] = unplaced[i];
    });
    onPlace(placed);
    setSelected(null);
  };

  return (
    <>
      <section className="u-stack u-gap-3">
        <div className="vm-sheet-head">
          <h2 className="vm-sheet-head-title">Your Six Rolls</h2>
          <span className="vm-sheet-head-hint">
            {anyRolled
              ? "tap a roll, then an ability"
              : "roll each one, or all that are left"}
          </span>
        </div>
        <div className="u-row u-wrap u-gap-3" role="group" aria-label="Rolls">
          {draft.pool.map((roll, slot) => {
            if (!roll)
              return (
                <span
                  key={slot}
                  className="osc-creation-roll-chip osc-creation-roll-chip-empty"
                >
                  <button
                    type="button"
                    className="vm-btn vm-btn-link"
                    aria-label={`Roll slot ${slot + 1}`}
                    aria-disabled={rolling}
                    onClick={() => !rolling && onRoll([slot])}
                  >
                    Roll
                  </button>
                </span>
              );
            if (!unplaced.includes(slot))
              return (
                <span
                  key={slot}
                  className="osc-creation-roll-chip osc-creation-roll-chip-empty"
                  aria-hidden="true"
                />
              );
            const pressed = slot === selectedSlot;
            return (
              <button
                key={slot}
                type="button"
                className="osc-creation-roll-chip vm-bevel"
                aria-pressed={pressed}
                aria-label={`${roll.total}, rolled ${roll.dice.join(" ")}`}
                onClick={() => setSelected(pressed ? null : slot)}
              >
                {roll.total}
                <small>{roll.dice.join("·")}</small>
              </button>
            );
          })}
          {unrolled.length > 0 && (
            <>
              <span className="u-flex-1" />
              <button
                type="button"
                className="vm-btn vm-btn-primary vm-btn-sm"
                aria-disabled={rolling}
                onClick={() => !rolling && onRoll(unrolled)}
              >
                {unrolled.length === draft.pool.length
                  ? "Roll six totals"
                  : `Roll remaining ${unrolled.length}`}
              </button>
            </>
          )}
        </div>
      </section>
      <section className="u-stack u-gap-3">
        <div className="vm-sheet-head">
          <h2 className="vm-sheet-head-title">Ability Scores</h2>
          <span className="vm-sheet-head-hint">{empty.length} to place</span>
          {anyRolled && (
            <div className="u-row u-gap-3 u-ml-auto tw:-my-1 tw:self-center">
              <button
                type="button"
                className="vm-btn vm-btn-secondary"
                aria-disabled={!unplaced.length || !empty.length}
                onClick={() => unplaced.length && placeRestInOrder()}
              >
                Place the rest in order
              </button>
              <button
                type="button"
                className="vm-btn vm-btn-secondary"
                aria-disabled={empty.length === ABILITIES.length}
                onClick={() => onPlace({})}
              >
                Clear placements
              </button>
            </div>
          )}
        </div>
        <ScoreGrid>
          {ABILITIES.map((ability) => {
            const roll = draft.pool[draft.placed[ability] ?? -1];
            const label = abbreviation(ability);
            return (
              <ScoreTile
                key={ability}
                ability={ability}
                face={
                  roll ? (
                    <button
                      type="button"
                      className={scoreFaceClass()}
                      aria-label={`${label} ${roll.total}, return to the rolls`}
                      onClick={() => unplace(ability)}
                    >
                      <ScoreFigure value={roll.total} mod={mods[ability]} />
                    </button>
                  ) : selectedRoll ? (
                    <button
                      type="button"
                      className={scoreFaceClass("vm-score-face-target")}
                      aria-label={`Place ${selectedRoll.total} on ${label}`}
                      onClick={() => place(ability)}
                    >
                      <span className="vm-score-placeholder">
                        Place {selectedRoll.total}
                      </span>
                    </button>
                  ) : (
                    <span className={scoreFaceClass("vm-score-face-empty")}>
                      <span
                        className="vm-score-placeholder"
                        aria-label={`${label} empty`}
                      >
                        —
                      </span>
                    </span>
                  )
                }
              />
            );
          })}
        </ScoreGrid>
      </section>
    </>
  );
}
