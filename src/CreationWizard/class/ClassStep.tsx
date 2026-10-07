import { useRef } from "react";
import { cx } from "@ui/cx";
import { MoreBelow } from "../MoreBelow";
import type { ClassDetail, ClassRestrictions, CreationClass } from "../rules";
import {
  ABILITIES,
  abbreviation,
  type AbilityScores,
} from "../scores/scoresDraft";
import { ClassDetails } from "./ClassDetails";
import { ineligibleReason, isEligible, requirementList } from "./classDraft";
import { XpAdjustmentText } from "./XpAdjustmentText";

type Props = {
  classes: CreationClass[];
  scores: AbilityScores;
  chosen?: CreationClass;
  restrictions?: ClassRestrictions;
  loadDetail: (name: string) => Promise<ClassDetail>;
  onChoose: (cls: CreationClass) => void;
};

export function ClassStep({
  classes,
  scores,
  chosen,
  restrictions,
  loadDetail,
  onChoose,
}: Props) {
  const paneRef = useRef<HTMLDivElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  return (
    <div className="osc-creation-split osc-creation-class-step">
      <div
        ref={paneRef}
        className="osc-creation-pane osc-creation-class-pane u-gap-3"
      >
        <div className="vm-sheet-head">
          <h2 className="vm-sheet-head-title">Choose a Class</h2>
          <span className="u-row u-gap-3" aria-label="Your scores">
            {ABILITIES.map((ability) => (
              <span
                key={ability}
                className="u-inline-flex u-gap-1 u-items-baseline"
              >
                <span className="vm-key">{abbreviation(ability)}</span>
                <span>{scores[ability]}</span>
              </span>
            ))}
          </span>
        </div>
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
                <th>Requires</th>
                <th>HD</th>
                <th>XP adjustment</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => {
                const eligible = isEligible(cls, scores, restrictions);
                const selected = chosen?.name === cls.name;
                return (
                  <tr
                    key={cls.name}
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
                      {cls.name}
                    </td>
                    <td className="vm-mono">
                      {cls.primeRequisites.map(abbreviation).join(", ") || "—"}
                    </td>
                    <td className="vm-mono">
                      {requirementList(cls).join(", ") || "—"}
                    </td>
                    <td className="vm-mono">{cls.hitDie}</td>
                    <td className={eligible ? "vm-mono" : undefined}>
                      {eligible ? (
                        <XpAdjustmentText cls={cls} scores={scores} withBasis />
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
        <MoreBelow scroller={paneRef} contentKey={classes} />
      </div>
      <aside
        ref={asideRef}
        className="osc-creation-aside osc-creation-class-aside u-stack"
        aria-label={chosen ? `${chosen.name} at first level` : "Class details"}
      >
        {chosen ? (
          <ClassDetails
            key={chosen.name}
            cls={chosen}
            scores={scores}
            loadDetail={loadDetail}
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
        <MoreBelow scroller={asideRef} contentKey={chosen?.name} />
      </aside>
    </div>
  );
}
