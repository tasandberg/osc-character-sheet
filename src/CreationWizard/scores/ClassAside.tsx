import { useRef, type ReactNode } from "react";
import { cx } from "@ui/cx";
import { xpAdjustment } from "../class/classDraft";
import { XpAdjustmentText } from "../class/XpAdjustmentText";
import { MoreBelow } from "../MoreBelow";
import type { CreationRules } from "../rules";
import { classStanding } from "./classStanding";
import { ABILITIES, abbreviation, type AbilityScores } from "./scoresDraft";

type Props = {
  rules: CreationRules;
  scores: AbilityScores;
  children?: ReactNode;
};

export function ClassAside({ rules, scores, children }: Props) {
  const asideRef = useRef<HTMLElement>(null);
  const known = ABILITIES.filter((a) => scores[a] !== undefined);
  const standings = rules.classes.map((cls) => ({
    cls,
    ...classStanding(cls, scores),
  }));
  const open = standings.filter((s) => s.status !== "failed").length;
  const hint = !known.length
    ? "after you roll"
    : known.length === ABILITIES.length
      ? `${open} of ${standings.length} open`
      : `waiting on ${ABILITIES.filter((a) => scores[a] === undefined)
          .map(abbreviation)
          .join(", ")}`;

  return (
    <aside
      ref={asideRef}
      className="osc-creation-aside u-stack"
      aria-label="Classes these scores allow"
    >
      <div className="vm-sheet-head">
        <h2 className="vm-sheet-head-title">Classes</h2>
        <span className="vm-sheet-head-hint">{hint}</span>
      </div>
      {children}
      {known.length ? (
        <ul className="osc-creation-class-list">
          {standings.map(({ cls, name, status, note }) => (
            <li
              key={cls.uuid}
              className={cx(
                "osc-creation-class-row",
                `osc-creation-class-${status}`,
              )}
              aria-disabled={status === "failed" || undefined}
            >
              <span className="osc-creation-class-name u-fs-base">{name}</span>
              {status === "open" ? (
                xpAdjustment(cls, scores, rules.xpBonus) && (
                  <span className="osc-creation-class-note vm-mono u-fs-2xs">
                    <XpAdjustmentText
                      cls={cls}
                      scores={scores}
                      xpBonus={rules.xpBonus}
                    />
                  </span>
                )
              ) : (
                <span className="osc-creation-class-note vm-mono u-fs-2xs">
                  {note}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="vm-help">
          Pick a method and roll. The classes your scores allow show here, with
          each one’s XP adjustment.
        </p>
      )}
      <MoreBelow scroller={asideRef} contentKey={rules.classes} />
    </aside>
  );
}
