import { useId, useState, type ReactNode } from "react";
import { cx } from "@ui/cx";
import { CompendiumDescription, Facts } from "../CompendiumText";
import {
  formatMaxLevel,
  maxLevel,
  ordinal,
  type CreationRace,
} from "../race/raceDraft";
import type {
  ClassAbility,
  ClassTable,
  CreationClass,
  CreationRules,
} from "../rules";
import type { AbilityScores } from "../scores/scoresDraft";
import { useCompendiumDetail } from "../useCompendiumDetail";
import { ChoiceIcon } from "../ChoiceIcon";
import { attackRow } from "./attackRow";
import { XpAdjustmentText } from "./XpAdjustmentText";
import { raceSaveNotes } from "../race/raceItems";

type Props = {
  cls: CreationClass;
  scores: AbilityScores;
  race?: CreationRace;
  rules: CreationRules;
};

const withArticle = (noun: string) =>
  `${/^[aeiou]/i.test(noun) ? "an" : "a"} ${noun}`;

function raceFacts(
  race: CreationRace,
  scores: AbilityScores,
): [string, ReactNode][] {
  const saves = raceSaveNotes(race, scores);
  return [
    ...(saves.length
      ? ([
          [
            "Saves",
            saves.map((note) => (
              <span key={note.summary}>
                {note.summary}
                {note.basis && (
                  <>
                    {" "}
                    <span className="vm-help">({note.basis})</span>
                  </>
                )}
              </span>
            )),
          ],
        ] as [string, ReactNode][])
      : []),
    ...(race.infravision
      ? ([["Infravision", `${race.infravision}′`]] as [string, ReactNode][])
      : []),
    ["Languages", race.languages.join(", ") || "None"],
  ];
}

function AbilityDisclosure({ ability }: { ability: ClassAbility }) {
  const [open, setOpen] = useState(false);
  const textId = useId();
  return (
    <li>
      <button
        type="button"
        className="osc-creation-class-ability-toggle u-row u-gap-2"
        aria-expanded={open}
        aria-controls={textId}
        onClick={() => setOpen((o) => !o)}
      >
        <i
          className={cx(
            "fa-solid u-fs-2xs",
            open ? "fa-chevron-down" : "fa-chevron-right",
          )}
          aria-hidden="true"
        />
        <span className="vm-heading vm-heading-sm">{ability.name}</span>
        {(ability.level ?? 1) > 1 && (
          <span className="vm-tag vm-tag-xs">
            from {ordinal(ability.level!)}
          </span>
        )}
      </button>
      <div
        id={textId}
        className="osc-creation-class-ability u-pb-2"
        hidden={!open}
        dangerouslySetInnerHTML={{ __html: ability.description }}
      />
    </li>
  );
}

function FirstLevelTable({ table }: { table: ClassTable }) {
  const row = table.rows[0];
  if (!row) return null;
  return (
    <section className="u-stack u-gap-3" aria-label={table.label}>
      <h3 className="vm-section-title-hairline">{table.label}</h3>
      <dl className="u-grid u-grid-2 u-gap-y-3 u-gap-x-4">
        {table.columns.map(({ key, name }) => (
          <div key={key} className="u-flex tw:flex-col u-gap-1">
            <dt className="vm-key tw:whitespace-normal">
              {name || key.toUpperCase()}
            </dt>
            <dd>{row[key] ?? "—"}</dd>
          </div>
        ))}
      </dl>
      {table.legend && table.legend.length > 0 && (
        <p className="vm-help">
          {table.legend.map((l) => `${l.value}: ${l.text}`).join(" ")}
        </p>
      )}
    </section>
  );
}

export function ClassDetails({ cls, scores, race, rules }: Props) {
  const loaded = useCompendiumDetail(cls.uuid, rules.classDetail);
  const detail = loaded.status === "ready" ? loaded.detail : undefined;
  const stats = rules.classStats(cls, 1);

  const facts: [string, ReactNode][] = [
    ...(race
      ? ([
          [
            "Max level",
            `${formatMaxLevel(maxLevel(race, cls))}, as ${withArticle(race.name.toLowerCase())}`,
          ],
        ] as [string, ReactNode][])
      : []),
    ["Hit die", cls.hitDie],
    [
      "Prime req.",
      <XpAdjustmentText
        cls={cls}
        scores={scores}
        xpBonus={rules.xpBonus}
        withBasis
      />,
    ],
    ["Armour", cls.armour ?? "—"],
    ["Weapons", cls.weapons ?? "—"],
    attackRow(stats, rules.ascendingAC),
    [
      "Next level",
      stats.nextXp === null ? "—" : `${stats.nextXp.toLocaleString()} xp`,
    ],
  ];

  return (
    <>
      <div className="vm-sheet-head">
        <h2 className="vm-sheet-head-title">
          <ChoiceIcon
            name={cls.name}
            iconKey={cls.key}
            size={22}
            color="gold"
            className="osc-creation-heading-icon"
          />
          {race ? `${race.name} ${cls.name}` : cls.name}
        </h2>
        <span className="vm-sheet-head-hint">level 1</span>
      </div>
      <CompendiumDescription loaded={loaded} noun="class" />
      <Facts facts={facts} />
      {race && (
        <section className="u-stack u-gap-3" aria-label="From race">
          <h3 className="vm-section-title-hairline">From race</h3>
          <Facts facts={raceFacts(race, scores)} />
        </section>
      )}
      {detail && detail.abilities.length > 0 && (
        <section className="u-stack u-gap-3" aria-label="Abilities">
          <h3 className="vm-section-title-hairline">Abilities</h3>
          <ul className="u-flex tw:flex-col">
            {detail.abilities.map((ability) => (
              <AbilityDisclosure key={ability.name} ability={ability} />
            ))}
          </ul>
        </section>
      )}
      {cls.tables.map((table) => (
        <FirstLevelTable key={table.key} table={table} />
      ))}
    </>
  );
}
