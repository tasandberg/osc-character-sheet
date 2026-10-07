import { useEffect, useId, useState, type ReactNode } from "react";
import { cx } from "@ui/cx";
import { Skeleton } from "@ui/Skeleton";
import type { ClassAbility, ClassDetail, CreationClass } from "../rules";
import { IN_SIX_SKILLS } from "../rules/classConstants";
import type { AbilityScores } from "../scores/scoresDraft";
import { XpAdjustmentText } from "./XpAdjustmentText";

type Props = {
  cls: CreationClass;
  scores: AbilityScores;
  loadDetail: (name: string) => Promise<ClassDetail>;
};

type Loaded =
  | { status: "loading" }
  | { status: "ready"; detail: ClassDetail }
  | { status: "failed" };

function useClassDetail(name: string, load: Props["loadDetail"]) {
  const [state, setState] = useState<Loaded>({ status: "loading" });
  useEffect(() => {
    let live = true;
    load(name).then(
      (detail) => live && setState({ status: "ready", detail }),
      () => live && setState({ status: "failed" }),
    );
    return () => {
      live = false;
    };
  }, [name, load]);
  return state;
}

const signed = (n: number) => (n < 0 ? `−${-n}` : `+${n}`);

const skillChance = (key: string, chance: number) =>
  IN_SIX_SKILLS.includes(key) ? `${chance}-in-6` : `${chance}%`;

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

export function ClassDetails({ cls, scores, loadDetail }: Props) {
  const loaded = useClassDetail(cls.name, loadDetail);
  const detail = loaded.status === "ready" ? loaded.detail : undefined;
  const pending = loaded.status === "loading" ? "…" : "—";

  const facts: [string, ReactNode][] = [
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
        <h2 className="vm-sheet-head-title">{cls.name}</h2>
        <span className="vm-sheet-head-hint">level 1</span>
      </div>
      {loaded.status === "loading" ? (
        <div className="u-stack u-gap-2" aria-busy="true" aria-label="Loading">
          <Skeleton height="var(--spacer-4)" />
          <Skeleton height="var(--spacer-4)" />
          <Skeleton width="60%" height="var(--spacer-4)" />
        </div>
      ) : loaded.status === "failed" ? (
        <p className="vm-help">
          Couldn’t load this class from the compendiums.
        </p>
      ) : detail?.description ? (
        <div
          className="osc-creation-class-description vm-flavor"
          dangerouslySetInnerHTML={{ __html: detail.description }}
        />
      ) : (
        <p className="vm-help">
          No class description found in the compendiums.
        </p>
      )}
      <dl className="u-grid tw:grid-cols-[max-content_minmax(0,1fr)] u-gap-x-4 u-gap-y-2 u-items-baseline">
        {facts.map(([label, value]) => (
          <div key={label} className="tw:contents">
            <dt className="vm-key">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
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
