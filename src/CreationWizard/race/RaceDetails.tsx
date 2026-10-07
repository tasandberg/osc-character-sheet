import { useId, useState, type ReactNode } from "react";
import { cx } from "@ui/cx";
import { CompendiumDescription, Facts } from "../CompendiumText";
import type { ClassAbility, RaceDetail } from "../rules";
import {
  ABILITIES,
  abbreviation,
  type AbilityScores,
} from "../scores/scoresDraft";
import { useCompendiumDetail } from "../useCompendiumDetail";
import {
  adjustedScores,
  formatMaxLevel,
  formatModifiers,
  raceLanguages,
  raceStanding,
  racialAbilityValue,
  requirementText,
  type CreationRace,
} from "./raceDraft";

type Props = {
  race: CreationRace;
  scores: AbilityScores;
  loadDetail: (name: string) => Promise<RaceDetail>;
};

function changedScores(race: CreationRace, scores: AbilityScores) {
  const adjusted = adjustedScores(scores, race);
  const changed = ABILITIES.filter(
    (a) => race.modifiers[a] && scores[a] !== undefined,
  );
  return changed.length
    ? changed.map((a) => `${abbreviation(a)} ${adjusted[a]}`).join(" · ")
    : "unchanged";
}

function RacialAbility({
  ability,
  value,
}: {
  ability: ClassAbility;
  value?: string;
}) {
  const [open, setOpen] = useState(false);
  const textId = useId();
  return (
    <>
      <dt className="vm-key tw:whitespace-normal">{ability.name}</dt>
      <dd className="vm-mono">{value}</dd>
      <dd>
        <button
          type="button"
          className="vm-icon-btn vm-icon-btn-sm"
          aria-expanded={open}
          aria-controls={textId}
          aria-label={`${ability.name} details`}
          onClick={() => setOpen((o) => !o)}
        >
          <i
            className={cx(
              "fa-solid u-fs-2xs",
              open ? "fa-chevron-up" : "fa-chevron-down",
            )}
            aria-hidden="true"
          />
        </button>
      </dd>
      <dd
        id={textId}
        className="osc-creation-class-ability vm-help tw:col-span-full"
        hidden={!open}
        dangerouslySetInnerHTML={{ __html: ability.description }}
      />
    </>
  );
}

export function RaceDetails({ race, scores, loadDetail }: Props) {
  const loaded = useCompendiumDetail(race.name, loadDetail);
  const standing = raceStanding(race, scores);
  const adjusted = adjustedScores(scores, race);

  const facts: [string, ReactNode][] = [
    ["Requires", requirementText(race) || "None"],
    ["Ability mods", formatModifiers(race.modifiers)],
    ["Your scores", changedScores(race, scores)],
    ["Languages", raceLanguages(race).join(", ")],
  ];
  const classes =
    race.maxLevels === "anyHumanClass"
      ? [["All non-demihuman classes", null] as const]
      : Object.entries(race.maxLevels);

  return (
    <>
      <div className="vm-sheet-head">
        <h2 className="vm-sheet-head-title">{race.name}</h2>
        <span className="vm-sheet-head-hint">race</span>
      </div>
      {standing.status === "failed" && (
        <p className="vm-field-error">
          Your scores don’t allow this race: needs {standing.note}.
        </p>
      )}
      <CompendiumDescription loaded={loaded} noun="race" />
      <Facts facts={facts} />
      <section className="u-stack u-gap-3" aria-label="Classes and max level">
        <h3 className="vm-section-title-hairline">Classes and max level</h3>
        <dl className="u-grid tw:grid-cols-[repeat(2,max-content_minmax(0,1fr))] u-gap-x-4 u-gap-y-2 u-items-baseline">
          {classes.map(([name, level]) => (
            <div key={name} className="tw:contents">
              <dt className="vm-key">
                {name}
                {race.npcOnly.includes(name) && "*"}
              </dt>
              <dd>{formatMaxLevel(level)}</dd>
            </div>
          ))}
        </dl>
        {race.npcOnly.length > 0 && (
          <p className="vm-help">
            * The referee may allow this class for NPCs only.
          </p>
        )}
      </section>
      <section className="u-stack u-gap-3" aria-label="Racial abilities">
        <h3 className="vm-section-title-hairline">Racial abilities</h3>
        {loaded.status !== "ready" ? (
          <p className="vm-help">
            {loaded.status === "loading" ? "Loading…" : "Couldn’t load them."}
          </p>
        ) : loaded.detail.abilities.length ? (
          <dl className="u-grid tw:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_var(--spacer-6)] u-gap-x-3 u-gap-y-2 u-items-center">
            {loaded.detail.abilities.map((ability) => (
              <RacialAbility
                key={ability.name}
                ability={ability}
                value={racialAbilityValue(race, ability.name, adjusted)}
              />
            ))}
          </dl>
        ) : (
          <p className="vm-help">No racial abilities.</p>
        )}
      </section>
    </>
  );
}
