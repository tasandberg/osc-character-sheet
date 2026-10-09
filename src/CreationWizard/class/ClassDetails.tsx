import { useId, useState, type ReactNode } from "react";
import { cx } from "@ui/cx";
import { CompendiumDescription, Facts } from "../CompendiumText";
import {
  formatMaxLevel,
  maxLevel,
  raceLanguages,
  raceSaveBonus,
  type CreationRace,
} from "../race/raceDraft";
import type { ClassAbility, ClassDetail, CreationClass } from "../rules";
import { IN_SIX_SKILLS } from "../rules/classConstants";
import type { AbilityScores } from "../scores/scoresDraft";
import { useCompendiumDetail } from "../useCompendiumDetail";
import { ChoiceIcon } from "../ChoiceIcon";
import { XpAdjustmentText } from "./XpAdjustmentText";

type Props = {
  cls: CreationClass;
  scores: AbilityScores;
  race?: CreationRace;
  loadDetail: (name: string) => Promise<ClassDetail>;
};

const withArticle = (noun: string) =>
  `${/^[aeiou]/i.test(noun) ? "an" : "a"} ${noun}`;

const signed = (n: number) => (n < 0 ? `−${-n}` : `+${n}`);

const skillChance = (key: string, chance: number) =>
  IN_SIX_SKILLS.includes(key) ? `${chance}-in-6` : `${chance}%`;

function raceFacts(
  race: CreationRace,
  scores: AbilityScores,
): [string, ReactNode][] {
  const save = raceSaveBonus(race, scores);
  return [
    [
      "Saves",
      save ? (
        <>
          {save.summary} <span className="vm-help">({save.basis})</span>
        </>
      ) : (
        "No racial bonus"
      ),
    ],
    ["Infravision", race.infravision ? `${race.infravision}′` : "None"],
    ["Languages", raceLanguages(race).join(", ")],
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

export function ClassDetails({ cls, scores, race, loadDetail }: Props) {
  const loaded = useCompendiumDetail(cls.name, loadDetail);
  const detail = loaded.status === "ready" ? loaded.detail : undefined;
  const pending = loaded.status === "loading" ? "…" : "—";

  const facts: [string, ReactNode][] = [
    ...(race
      ? ([
          [
            "Max level",
            `${formatMaxLevel(maxLevel(race, cls.name))}, as ${withArticle(race.name.toLowerCase())}`,
          ],
        ] as [string, ReactNode][])
      : []),
    ["Hit die", cls.hitDie],
    ["Prime req.", <XpAdjustmentText cls={cls} scores={scores} withBasis />],
    ["Armour", detail?.armour ?? pending],
    ["Weapons", detail?.weapons ?? pending],
    ["THAC0", `${cls.thac0} [${signed(19 - cls.thac0)}]`],
    [
      "Next level",
      cls.nextLevelXp === null ? "—" : `${cls.nextLevelXp.toLocaleString()} xp`,
    ],
  ];

  return (
    <>
      <div className="vm-sheet-head">
        <h2 className="vm-sheet-head-title">
          <ChoiceIcon
            name={cls.name}
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
      {detail && (detail.abilities.length > 0 || cls.skills.length > 0) && (
        <section className="u-stack u-gap-3" aria-label="Abilities">
          <h3 className="vm-section-title-hairline">Abilities</h3>
          {detail.abilities.length > 0 && (
            <ul className="u-flex tw:flex-col">
              {detail.abilities.map((ability) => (
                <AbilityDisclosure key={ability.name} ability={ability} />
              ))}
            </ul>
          )}
          {cls.skills.length > 0 && (
            <dl className="u-grid u-grid-2 u-gap-y-3 u-gap-x-4">
              {cls.skills.map(({ key, chance }) => (
                <div key={key} className="u-flex tw:flex-col u-gap-1">
                  <dt className="vm-key tw:whitespace-normal">
                    {detail.skillLabels[key] ?? key.toUpperCase()}
                  </dt>
                  <dd>{skillChance(key, chance)}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      )}
    </>
  );
}
