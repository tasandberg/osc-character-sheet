import { useId, type ReactNode } from "react";
import { cx } from "@ui/cx";
import {
  ALIGNMENTS,
  parseHitPoints,
  type CharacterDetails,
  type DetailsDraft,
} from "../details/detailsDraft";
import { goldLeft, type GearDraft } from "../gear/gearDraft";
import { PackLines } from "../gear/GearStep";
import { ordinal, raceLanguages, type CreationRace } from "../race/raceDraft";
import type { CreationClass, CreationRules } from "../rules";
import { nativeLanguages } from "../rules/classConstants";
import { formatXpModifier, xpAdjustment } from "../rules/xpAdjustment";
import { formatModifier } from "../scores/scoreFace";
import {
  ABILITIES,
  ABILITY_NAMES,
  type AbilityScores,
} from "../scores/scoresDraft";
import { STEP_LABELS, type CreationStep } from "../steps";

type Props = {
  details: DetailsDraft;
  character: CharacterDetails;
  cls: CreationClass;
  race?: CreationRace;
  scores: AbilityScores;
  gear: GearDraft;
  rules: CreationRules;
};

function Section({
  step,
  children,
}: {
  step: CreationStep;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section className="u-stack u-gap-2" aria-labelledby={id}>
      <h3 id={id} className="vm-heading vm-heading-sm">
        {STEP_LABELS[step]}
      </h3>
      {children}
    </section>
  );
}

function Facts({
  facts,
  columns = 3,
  label,
}: {
  facts: [string, ReactNode][];
  columns?: 3 | 5 | 6;
  label?: string;
}) {
  return (
    <dl
      aria-label={label}
      className={cx(
        "u-grid u-gap-x-4 u-gap-y-3",
        columns === 3 && "u-grid-3",
        columns === 5 && "tw:grid-cols-5",
        columns === 6 && "tw:grid-cols-6",
      )}
    >
      {facts.map(([key, value]) => (
        <div key={key} className="u-flex tw:flex-col u-gap-1">
          <dt className="vm-key">{key}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ReviewStep({
  details,
  character,
  cls,
  race,
  scores,
  gear,
  rules,
}: Props) {
  const modifiers = rules.modifiers(scores);
  const xp = xpAdjustment(cls, scores);
  const { row, level, nextXp } = character;
  const alignment = ALIGNMENTS.find((a) => a.value === details.alignment);
  const languages = (
    race ? raceLanguages(race) : nativeLanguages(cls.name)
  ).join(", ");

  return (
    <div className="u-stack u-gap-5">
      <div className="vm-sheet-head">
        <h2 className="vm-sheet-head-title">{details.name.trim()}</h2>
        <span className="vm-sheet-head-hint">
          {[alignment?.label, race?.name, cls.name].filter(Boolean).join(" ")}
          {` · ${ordinal(level)} level`}
        </span>
      </div>
      <Section step="scores">
        <Facts
          columns={6}
          facts={ABILITIES.map((a) => [
            ABILITY_NAMES[a],
            <span key={a}>
              <span className="u-fs-lg">{scores[a]}</span>{" "}
              <span className="u-text-dim">
                {formatModifier(modifiers[a] ?? 0)}
              </span>
            </span>,
          ])}
        />
      </Section>
      {race && (
        <Section step="race">
          <Facts
            facts={[
              ["Race", race.name],
              ["Languages", languages],
            ]}
          />
        </Section>
      )}
      <Section step="class">
        <Facts
          facts={[
            ["Class", cls.name],
            [
              "XP adjustment",
              xp ? `${formatXpModifier(xp.modifier)} (${xp.basis})` : "None",
            ],
            ...(race ? [] : ([["Languages", languages]] as [string, string][])),
          ]}
        />
      </Section>
      <Section step="details">
        <Facts
          facts={[
            ["Alignment", alignment?.label ?? "—"],
            ["Level", ordinal(level)],
            ["Hit points", parseHitPoints(character.hitPoints?.value) ?? "—"],
            ["Hit dice", row.hd],
            ["THAC0", `${row.thac0} [${formatModifier(19 - row.thac0)}]`],
            [
              "Experience",
              `${row.xp.toLocaleString()} xp${
                nextXp === null ? "" : ` of ${nextXp.toLocaleString()}`
              }`,
            ],
          ]}
        />
        <Facts
          columns={5}
          label="Saving throws"
          facts={rules.saveNames.map((name, i) => [name, row.saves[i]])}
        />
      </Section>
      <Section step="gear">
        {gear.cart.length ? (
          <PackLines cart={gear.cart} />
        ) : (
          <p className="vm-help">No gear.</p>
        )}
        <Facts facts={[["Gold left", `${goldLeft(gear)} gp`]]} />
      </Section>
    </div>
  );
}
