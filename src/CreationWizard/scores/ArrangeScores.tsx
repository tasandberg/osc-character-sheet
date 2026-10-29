import { useState, type KeyboardEvent } from "react";
import { cx } from "@ui/cx";
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
import { useNativeDrag } from "./useNativeDrag";

type Props = {
  draft: ScoresDraft;
  mods: AbilityScores;
  rolling: boolean;
  onRoll: (slots: number[]) => void;
  onPlace: (placed: ScoresDraft["placed"]) => void;
};

type Held = { slot: number; from: Ability | null };

const POOL_TARGET = "pool";

const isAbility = (target: string): target is Ability =>
  (ABILITIES as readonly string[]).includes(target);

export function ArrangeScores({
  draft,
  mods,
  rolling,
  onRoll,
  onPlace,
}: Props) {
  const [held, setHeld] = useState<Held | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const unplaced = unplacedSlots(draft);
  const unrolled = draft.pool.flatMap((roll, slot) => (roll ? [] : [slot]));
  const empty = ABILITIES.filter((a) => draft.placed[a] === undefined);
  const anyRolled = unrolled.length < draft.pool.length;

  const holding =
    held &&
    draft.pool[held.slot] &&
    (held.from
      ? draft.placed[held.from] === held.slot
      : unplaced.includes(held.slot))
      ? held
      : null;
  const heldRoll = holding ? draft.pool[holding.slot] : null;
  const total = (slot: number) => draft.pool[slot]?.total ?? "";

  const say = (text: string) => setAnnouncement(text);

  const release = () => setHeld(null);

  const pickUp = (item: Held) => {
    setHeld(item);
    say(
      item.from
        ? `Picked up ${total(item.slot)} from ${abbreviation(item.from)}. Choose an ability, or return it to the rolls.`
        : `Picked up ${total(item.slot)}. Choose an ability.`,
    );
  };

  const cancel = () => {
    if (held) say("Cancelled.");
    release();
  };

  const dropOn = (item: Held, ability: Ability) => {
    release();
    if (item.from === ability) return;
    const placed = { ...draft.placed };
    const displaced = placed[ability];
    if (item.from) delete placed[item.from];
    placed[ability] = item.slot;
    const label = abbreviation(ability);
    if (displaced !== undefined && item.from) {
      placed[item.from] = displaced;
      say(
        `Swapped: ${total(item.slot)} on ${label}, ${total(displaced)} on ${abbreviation(item.from)}.`,
      );
    } else if (displaced !== undefined) {
      say(
        `Placed ${total(item.slot)} on ${label}. ${total(displaced)} returned to the rolls.`,
      );
    } else {
      say(`Placed ${total(item.slot)} on ${label}.`);
    }
    onPlace(placed);
  };

  const returnToPool = (item: Held) => {
    if (!item.from) {
      cancel();
      return;
    }
    release();
    onPlace(
      Object.fromEntries(
        Object.entries(draft.placed).filter(([key]) => key !== item.from),
      ),
    );
    say(`Returned ${total(item.slot)} to the rolls.`);
  };

  const drag = useNativeDrag<Held>({
    onStart: pickUp,
    onDrop: (item, target) =>
      target === POOL_TARGET
        ? returnToPool(item)
        : isAbility(target)
          ? dropOn(item, target)
          : cancel(),
    onCancel: cancel,
  });

  const placeRestInOrder = () => {
    const placed = { ...draft.placed };
    empty.forEach((ability, i) => {
      if (unplaced[i] !== undefined) placed[ability] = unplaced[i];
    });
    onPlace(placed);
    release();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === " " && e.target instanceof HTMLButtonElement) {
      e.preventDefault();
      e.stopPropagation();
      e.target.click();
      return;
    }
    if (e.key !== "Escape" || !holding) return;
    e.preventDefault();
    e.stopPropagation();
    cancel();
  };

  return (
    <div className="tw:contents" onKeyDown={onKeyDown}>
      <p className="tw:sr-only" aria-live="polite">
        {announcement}
      </p>
      <section className="u-stack u-gap-3">
        <div className="vm-sheet-head">
          <h2 className="vm-sheet-head-title">Your Six Rolls</h2>
          <span className="vm-sheet-head-hint">
            {anyRolled
              ? "drag a roll onto an ability, or tap one then the other"
              : "roll each one, or all that are left"}
          </span>
        </div>
        <div
          className={cx(
            "osc-creation-roll-pool u-row u-wrap u-gap-3",
            drag.over === POOL_TARGET && holding?.from && "is-drop-over",
          )}
          role="group"
          aria-label="Rolls"
          {...drag.dropProps(POOL_TARGET)}
        >
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
            if (!unplaced.includes(slot)) {
              const returnable = holding?.from && holding.slot === slot;
              return returnable ? (
                <button
                  key={slot}
                  type="button"
                  className="osc-creation-roll-chip osc-creation-roll-chip-empty osc-creation-roll-return"
                  aria-label={`Return ${roll.total} to the rolls`}
                  onClick={() => returnToPool(holding)}
                >
                  <small>return</small>
                </button>
              ) : (
                <span
                  key={slot}
                  className="osc-creation-roll-chip osc-creation-roll-chip-empty"
                  aria-hidden="true"
                />
              );
            }
            const item: Held = { slot, from: null };
            const pressed = holding?.slot === slot && holding.from === null;
            return (
              <button
                key={slot}
                type="button"
                className={cx(
                  "osc-creation-roll-chip osc-creation-draggable vm-bevel",
                  drag.dragging?.slot === slot && "is-dragging",
                )}
                aria-pressed={pressed}
                aria-label={`${roll.total}, rolled ${roll.dice.join(" ")}`}
                onClick={() => (pressed ? cancel() : pickUp(item))}
                {...drag.dragProps(item)}
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
                onClick={() => {
                  onPlace({});
                  release();
                }}
              >
                Clear placements
              </button>
            </div>
          )}
        </div>
        <ScoreGrid>
          {ABILITIES.map((ability) => {
            const slot = draft.placed[ability];
            const roll = draft.pool[slot ?? -1];
            const label = abbreviation(ability);
            const isSource = holding?.from === ability;
            const over = drag.over === ability && !isSource;
            let face;
            if (roll && slot !== undefined) {
              const item: Held = { slot, from: ability };
              const targetLabel =
                !holding || isSource
                  ? `${label} ${roll.total}`
                  : holding.from
                    ? `Swap ${heldRoll?.total} with ${label} ${roll.total}`
                    : `Replace ${label} ${roll.total} with ${heldRoll?.total}`;
              face = (
                <button
                  type="button"
                  className={cx(
                    scoreFaceClass(
                      "osc-creation-draggable",
                      holding && !isSource && "vm-score-face-target",
                    ),
                    drag.dragging?.from === ability && "is-dragging",
                    over && "is-drop-over",
                  )}
                  aria-pressed={isSource}
                  aria-label={targetLabel}
                  {...drag.dropProps(ability)}
                  onClick={() =>
                    isSource
                      ? cancel()
                      : holding
                        ? dropOn(holding, ability)
                        : pickUp(item)
                  }
                  {...drag.dragProps(item)}
                >
                  <ScoreFigure value={roll.total} mod={mods[ability]} />
                </button>
              );
            } else if (holding && heldRoll) {
              face = (
                <button
                  type="button"
                  className={cx(
                    scoreFaceClass("vm-score-face-target"),
                    over && "is-drop-over",
                  )}
                  aria-label={`Place ${heldRoll.total} on ${label}`}
                  {...drag.dropProps(ability)}
                  onClick={() => dropOn(holding, ability)}
                >
                  <span className="vm-score-placeholder">
                    Place {heldRoll.total}
                  </span>
                </button>
              );
            } else {
              face = (
                <span className={scoreFaceClass("vm-score-face-empty")}>
                  <span
                    className="vm-score-placeholder"
                    aria-label={`${label} empty`}
                  >
                    —
                  </span>
                </span>
              );
            }
            return <ScoreTile key={ability} ability={ability} face={face} />;
          })}
        </ScoreGrid>
      </section>
    </div>
  );
}
