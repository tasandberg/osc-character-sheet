import { useId, useState, type ReactNode } from "react";
import { cx } from "@ui/cx";
import { ChoiceIcon } from "../ChoiceIcon";
import { CompendiumDescription, Facts } from "../CompendiumText";
import type { CreationClass, CreationRules, RaceAbility } from "../rules";
import {
  ABILITIES,
  abbreviation,
  type AbilityScores,
} from "../scores/scoresDraft";
import { useCompendiumDetail } from "../useCompendiumDetail";
import {
  classKeyOf,
  formatMaxLevel,
  formatModifiers,
  ordinal,
  raceStanding,
  requirementText,
  type CreationRace,
} from "./raceDraft";

type Props = {
  race: CreationRace;
  classes: CreationClass[];
  scores: AbilityScores;
  rules: Pick<CreationRules, "raceDetail" | "raceScores">;
};

function changedScores(
  race: CreationRace,
  scores: AbilityScores,
  adjusted: AbilityScores,
) {
  const changed = ABILITIES.filter(
    (a) => race.modifiers[a] && scores[a] !== undefined,
  );
  return changed.length
    ? changed.map((a) => `${abbreviation(a)} ${adjusted[a]}`).join(" · ")
    : "unchanged";
}

function RacialAbility({ ability }: { ability: RaceAbility }) {
  const [open, setOpen] = useState(false);
  const textId = useId();
  return (
    <>
      <dt className="vm-key tw:whitespace-normal">{ability.name}</dt>
      <dd className="vm-mono">
        {ability.level > 1 ? `from ${ordinal(ability.level)} level` : ""}
      </dd>
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

export function RaceDetails({ race, classes, scores, rules }: Props) {
  const loaded = useCompendiumDetail(race.uuid, rules.raceDetail);
  const standing = raceStanding(race, scores);
  const adjusted = rules.raceScores(scores, race);
  const className = (key: string) =>
    classes.find((cls) => classKeyOf(cls) === key)?.name ?? key;

  const facts: [string, ReactNode][] = [
    ["Requires", requirementText(race) || "None"],
    ["Ability mods", formatModifiers(race.modifiers)],
    ["Your scores", changedScores(race, scores, adjusted)],
    ["Languages", race.languages.join(", ") || "None"],
  ];

  return (
    <>
      <div className="vm-sheet-head">
        <h2 className="vm-sheet-head-title">
          <ChoiceIcon
            name={race.name}
            size={22}
            color="gold"
            className="osc-creation-heading-icon"
          />
          {race.name}
        </h2>
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
        {race.classLimits.length ? (
          <dl className="u-grid tw:grid-cols-[repeat(2,max-content_minmax(0,1fr))] u-gap-x-4 u-gap-y-2 u-items-baseline">
            {race.classLimits.map(({ classKey, maxLevel }) => (
              <div key={classKey} className="tw:contents">
                <dt className="vm-key">{className(classKey)}</dt>
                <dd>{formatMaxLevel(maxLevel)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="vm-help">No classes listed.</p>
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
              <RacialAbility key={ability.name} ability={ability} />
            ))}
          </dl>
        ) : (
          <p className="vm-help">No racial abilities.</p>
        )}
      </section>
    </>
  );
}
