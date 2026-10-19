import { useRef, type ReactNode } from "react";
import { cx } from "@ui/cx";
import { MoreBelow } from "../MoreBelow";
import {
  formatModifiers,
  raceStanding,
  type CreationRace,
} from "../race/raceDraft";
import { ABILITIES, type AbilityScores } from "./scoresDraft";

type Props = {
  races: CreationRace[];
  scores: AbilityScores;
  children?: ReactNode;
};

const openNote = (race: CreationRace) => {
  if (race.maxLevels === "anyHumanClass") return "any class";
  const mods = formatModifiers(race.modifiers);
  return mods === "None" ? "no modifiers" : mods;
};

export function RaceAside({ races, scores, children }: Props) {
  const asideRef = useRef<HTMLElement>(null);
  const known = ABILITIES.some((a) => scores[a] !== undefined);
  const standings = races.map((race) => ({
    race,
    ...raceStanding(race, scores),
  }));
  const open = standings.filter((s) => s.status === "open").length;

  return (
    <aside
      ref={asideRef}
      className="osc-creation-aside u-stack"
      aria-label="Races these scores allow"
    >
      <div className="vm-sheet-head">
        <h2 className="vm-sheet-head-title">Race</h2>
        <span className="vm-sheet-head-hint">
          {known ? `${open} of ${races.length} open` : "after you roll"}
        </span>
      </div>
      {children}
      <ul className="osc-creation-class-list">
        {standings.map(({ race, status, note }) => (
          <li
            key={race.name}
            className={cx(
              "osc-creation-class-row",
              `osc-creation-class-${status}`,
            )}
            aria-disabled={status === "failed" || undefined}
          >
            <span className="osc-creation-class-name u-fs-base">
              {race.name}
            </span>
            <span className="osc-creation-class-note vm-mono u-fs-2xs">
              {status === "open" ? openNote(race) : note}
            </span>
          </li>
        ))}
      </ul>
      <MoreBelow scroller={asideRef} contentKey={races} />
    </aside>
  );
}
