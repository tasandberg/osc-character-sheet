import { useRef } from "react";
import { cx } from "@ui/cx";
import { MoreBelow } from "../MoreBelow";
import type { ClassRestrictions, CreationClass, CreationRules } from "../rules";
import { ScoreLine } from "../scores/ScoreLine";
import { abbreviation, type AbilityScores } from "../scores/scoresDraft";
import { formatMaxLevel, maxLevel, type CreationRace } from "../race/raceDraft";
import { ClassDetails } from "./ClassDetails";
import { ChoiceIcon } from "../ChoiceIcon";
import { ineligibleReason, isEligible, requirementList } from "./classDraft";
import { XpAdjustmentText } from "./XpAdjustmentText";

type Props = {
  classes: CreationClass[];
  scores: AbilityScores;
  chosen?: CreationClass;
  race?: CreationRace;
  restrictions?: ClassRestrictions;
  rules: CreationRules;
  onChoose: (cls: CreationClass) => void;
};

export function ClassStep({
  classes,
  scores,
  chosen,
  race,
  restrictions,
  rules,
  onChoose,
}: Props) {
  const paneRef = useRef<HTMLDivElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const allowed = (cls: CreationClass) =>
    !restrictions?.allowed || restrictions.allowed(cls.name);
  const shown = race ? classes.filter(allowed) : classes;
  const closed = race
    ? classes
        .filter((cls) => !allowed(cls) && !cls.demihuman)
        .map((cls) => cls.name)
    : [];
  return (
    <div className="osc-creation-split osc-creation-class-step">
      <div
        ref={paneRef}
        className="osc-creation-pane osc-creation-class-pane u-gap-3"
      >
        <div className="vm-sheet-head">
          <h2 className="vm-sheet-head-title">Choose a Class</h2>
          {race && <span className="vm-sheet-head-hint">as {race.name}</span>}
          <ScoreLine
            scores={scores}
            label={race ? `Your scores as ${race.name}` : "Your scores"}
          />
        </div>
        {classes.length === 0 ? (
          <p className="vm-help">
            No class items found. Enable a compendium module with class items,
            such as the Classic Fantasy Compendium, or create class items in
            this world.
          </p>
        ) : (
          <fieldset>
            <legend className="tw:sr-only">Class</legend>
            <table className="osc-creation-class-table">
              <thead>
                <tr>
                  <th>
                    <span className="tw:sr-only">Choose</span>
                  </th>
                  <th>Class</th>
                  <th>Prime req.</th>
                  {!race && <th>Requires</th>}
                  <th>HD</th>
                  {race && <th>Max level</th>}
                  <th>XP adjustment</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((cls) => {
                  const eligible = isEligible(cls, scores, restrictions);
                  const selected = chosen?.uuid === cls.uuid;
                  return (
                    <tr
                      key={cls.uuid}
                      className={cx(selected && "osc-creation-class-selected")}
                      aria-disabled={!eligible || undefined}
                      onClick={eligible ? () => onChoose(cls) : undefined}
                    >
                      <td className="osc-creation-class-select">
                        <label className="vm-check vm-check-radio">
                          <input
                            className="vm-check-input"
                            type="radio"
                            name="osc-creation-class"
                            aria-label={cls.name}
                            checked={selected}
                            disabled={!eligible}
                            onChange={() => onChoose(cls)}
                          />
                          <span className="vm-check-box">
                            <span className="vm-check-dot" />
                          </span>
                        </label>
                      </td>
                      <td className="osc-creation-class-name u-fs-md">
                        <span className="u-row">
                          <ChoiceIcon
                            name={cls.name}
                            iconKey={cls.key}
                            size={18}
                            color={
                              !eligible ? "mute" : selected ? "gold" : "dim"
                            }
                          />
                          {cls.name}
                        </span>
                      </td>
                      <td className="vm-mono">
                        {cls.primeRequisites.map(abbreviation).join(", ") ||
                          "—"}
                      </td>
                      {!race && (
                        <td className="vm-mono">
                          {requirementList(cls).join(", ") || "—"}
                        </td>
                      )}
                      <td className="vm-mono">{cls.hitDie}</td>
                      {race && (
                        <td className="vm-mono">
                          {formatMaxLevel(maxLevel(race, cls))}
                        </td>
                      )}
                      <td className={eligible ? "vm-mono" : undefined}>
                        {eligible ? (
                          <XpAdjustmentText
                            cls={cls}
                            scores={scores}
                            xpBonus={rules.xpBonus}
                            withBasis
                          />
                        ) : (
                          <span className="osc-creation-class-reason u-fs-xs">
                            {ineligibleReason(cls, restrictions)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </fieldset>
        )}
        {race && (
          <p className="vm-help">
            {closed.length > 0 &&
              `${race.name} characters can’t take ${closed.join(", ")}. `}
            Race classes like Dwarf and Elf are hidden while race is chosen
            separately.
          </p>
        )}
        <MoreBelow scroller={paneRef} contentKey={shown} />
      </div>
      <aside
        ref={asideRef}
        className="osc-creation-aside osc-creation-class-aside u-stack"
        aria-label={chosen ? `${chosen.name} at first level` : "Class details"}
      >
        {chosen ? (
          <ClassDetails
            key={chosen.uuid}
            cls={chosen}
            scores={scores}
            race={race}
            rules={rules}
          />
        ) : (
          <>
            <div className="vm-sheet-head">
              <h2 className="vm-sheet-head-title">Class</h2>
            </div>
            <p className="vm-help">
              Choose a class to see what it does at first level.
            </p>
          </>
        )}
        <MoreBelow scroller={asideRef} contentKey={chosen?.uuid} />
      </aside>
    </div>
  );
}
