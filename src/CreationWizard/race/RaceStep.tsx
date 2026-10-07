import { useRef } from "react";
import { cx } from "@ui/cx";
import { MoreBelow } from "../MoreBelow";
import type { RaceDetail } from "../rules";
import { ScoreLine } from "../scores/ScoreLine";
import type { AbilityScores } from "../scores/scoresDraft";
import {
  formatModifiers,
  raceStanding,
  requirementText,
  type CreationRace,
} from "./raceDraft";
import { RaceDetails } from "./RaceDetails";

type Props = {
  races: CreationRace[];
  scores: AbilityScores;
  chosen?: CreationRace;
  loadDetail: (name: string) => Promise<RaceDetail>;
  onChoose: (race: CreationRace) => void;
};

const classCount = (race: CreationRace) =>
  race.maxLevels === "anyHumanClass"
    ? "any class, no limit"
    : `${Object.keys(race.maxLevels).length} classes`;

export function RaceStep({
  races,
  scores,
  chosen,
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
          <h2 className="vm-sheet-head-title">Choose a Race</h2>
          <ScoreLine scores={scores} label="Your scores" />
        </div>
        <fieldset>
          <legend className="tw:sr-only">Race</legend>
          <table className="osc-creation-class-table">
            <thead>
              <tr>
                <th>
                  <span className="tw:sr-only">Choose</span>
                </th>
                <th>Race</th>
                <th>Requires</th>
                <th>Ability mods</th>
                <th>Classes</th>
              </tr>
            </thead>
            <tbody>
              {races.map((race) => {
                const standing = raceStanding(race, scores);
                const eligible = standing.status === "open";
                const selected = chosen?.name === race.name;
                return (
                  <tr
                    key={race.name}
                    className={cx(selected && "osc-creation-class-selected")}
                    aria-disabled={!eligible || undefined}
                    onClick={eligible ? () => onChoose(race) : undefined}
                  >
                    <td className="osc-creation-class-select">
                      <label className="vm-check vm-check-radio">
                        <input
                          className="vm-check-input"
                          type="radio"
                          name="osc-creation-race"
                          aria-label={race.name}
                          checked={selected}
                          disabled={!eligible}
                          onChange={() => onChoose(race)}
                        />
                        <span className="vm-check-box">
                          <span className="vm-check-dot" />
                        </span>
                      </label>
                    </td>
                    <td className="osc-creation-class-name u-fs-md">
                      {race.name}
                    </td>
                    <td className="vm-mono">{requirementText(race) || "—"}</td>
                    <td className="vm-mono">
                      {formatModifiers(race.modifiers)}
                    </td>
                    <td className={eligible ? "vm-mono u-text-dim" : undefined}>
                      {eligible ? (
                        classCount(race)
                      ) : (
                        <span className="osc-creation-class-reason u-fs-xs">
                          Needs {standing.note}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </fieldset>
        <p className="vm-help">
          Race ability modifiers apply before class requirements. Languages come
          from the race.
        </p>
        <MoreBelow scroller={paneRef} contentKey={races} />
      </div>
      <aside
        ref={asideRef}
        className="osc-creation-aside osc-creation-class-aside u-stack"
        aria-label={chosen ? `${chosen.name} race` : "Race details"}
      >
        {chosen ? (
          <RaceDetails
            key={chosen.name}
            race={chosen}
            scores={scores}
            loadDetail={loadDetail}
          />
        ) : (
          <>
            <div className="vm-sheet-head">
              <h2 className="vm-sheet-head-title">Race</h2>
            </div>
            <p className="vm-help">
              Choose a race to see its abilities, languages and classes.
            </p>
          </>
        )}
        <MoreBelow scroller={asideRef} contentKey={chosen?.name} />
      </aside>
    </div>
  );
}
