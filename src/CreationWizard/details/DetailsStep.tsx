import { useId, useRef, useState } from "react";
import { cx } from "@ui/cx";
import { VellumSegmented } from "@features/settings/controls";
import { MoreBelow } from "../MoreBelow";
import { ordinal, raceSaveBonus, type CreationRace } from "../race/raceDraft";
import type {
  Alignment,
  AlignmentText,
  CreationClass,
  CreationRules,
} from "../rules";
import { formatModifier } from "../scores/scoreFace";
import { DiceRow } from "../scores/ScoreTile";
import type { AbilityScores } from "../scores/scoresDraft";
import { useCompendiumDetail } from "../useCompendiumDetail";
import {
  ALIGNMENTS,
  SAVES,
  parseHitPoints,
  spellSlots,
  type CharacterDetails,
  type DetailsDraft,
} from "./detailsDraft";

type Props = {
  draft: DetailsDraft;
  details: CharacterDetails;
  cls: CreationClass;
  race?: CreationRace;
  scores: AbilityScores;
  rules: CreationRules;
  onChange: (update: (draft: DetailsDraft) => DetailsDraft) => void;
};

function LevelStepper({
  level,
  cap,
  onLevel,
}: {
  level: number;
  cap: number;
  onLevel: (level: number) => void;
}) {
  const labelId = useId();
  const step = (to: number) => {
    if (to >= 1 && to <= cap) onLevel(to);
  };
  return (
    <div className="vm-field u-gap-1">
      <span className="vm-key" id={labelId}>
        Level
      </span>
      <div className="vm-stepper" role="group" aria-labelledby={labelId}>
        <button
          type="button"
          className="vm-stepper-btn"
          aria-label="Lower level"
          aria-disabled={level <= 1}
          onClick={() => step(level - 1)}
        >
          <i className="fa-solid fa-minus u-fs-2xs" aria-hidden="true" />
        </button>
        <output className="vm-stepper-value u-fs-3xl" aria-live="polite">
          {level}
        </output>
        <button
          type="button"
          className="vm-stepper-btn"
          aria-label="Raise level"
          aria-disabled={level >= cap}
          onClick={() => step(level + 1)}
        >
          <i className="fa-solid fa-plus u-fs-2xs" aria-hidden="true" />
        </button>
      </div>
      <span className="vm-field-helper osc-creation-nowrap">
        up to {ordinal(cap)}
      </span>
    </div>
  );
}

function AlignmentSection({
  draft,
  onChange,
}: Pick<Props, "draft" | "onChange">) {
  return (
    <section
      className="osc-creation-rule u-stack u-gap-3 u-pt-4"
      aria-labelledby="osc-creation-al"
    >
      <div className="vm-sheet-head">
        <h2 className="vm-sheet-head-title" id="osc-creation-al">
          Alignment
        </h2>
      </div>
      <VellumSegmented
        label="Alignment"
        options={ALIGNMENTS}
        value={draft.alignment as Alignment}
        onChange={(alignment) => onChange((d) => ({ ...d, alignment }))}
      />
    </section>
  );
}

function AlignmentDescription({
  alignment,
  alignmentText,
}: {
  alignment?: Alignment;
  alignmentText: () => Promise<AlignmentText>;
}) {
  const loaded = useCompendiumDetail("alignment", alignmentText);
  const chosen = ALIGNMENTS.find((a) => a.value === alignment);
  if (!chosen) return null;
  const text =
    loaded.status === "ready" ? loaded.detail[chosen.value] : undefined;
  return (
    <section className="osc-creation-rule u-stack u-gap-2 u-pt-3">
      <h3 className="vm-heading vm-heading-sm">{chosen.label}</h3>
      {text ? (
        <p className="vm-flavor">{text}</p>
      ) : (
        loaded.status !== "loading" && (
          <p className="vm-help">
            No alignment description found in the compendiums.
          </p>
        )
      )}
    </section>
  );
}

function HitPointsSection({
  details,
  cls,
  rules,
  onChange,
}: Pick<Props, "details" | "cls" | "rules" | "onChange">) {
  const [rolling, setRolling] = useState(false);
  const { row, formula, conBonus, hitPoints } = details;
  const text = hitPoints?.value ?? "";
  const invalid = text.trim() !== "" && parseHitPoints(text) === undefined;
  const con = conBonus ? `, ${formatModifier(conBonus)} for Constitution` : "";
  const help = hitPoints?.dice
    ? `Rolled ${row.hd} for ${cls.name}${con}.`
    : hitPoints?.maximum
      ? `Maximum of ${row.hd} for ${cls.name}${con}, by house rule.`
      : `${cls.name} hit dice ${row.hd}${con}.`;

  const roll = async () => {
    if (rolling) return;
    setRolling(true);
    try {
      const result = await rules.rollHitPoints(
        formula,
        `Hit points (${row.hd})`,
      );
      onChange((d) => ({
        ...d,
        hitPoints: { value: String(result.total), formula, dice: result.dice },
      }));
    } finally {
      setRolling(false);
    }
  };

  return (
    <section
      className="osc-creation-rule u-stack u-gap-3 u-pt-4"
      aria-labelledby="osc-creation-hp"
    >
      <div className="vm-sheet-head">
        <h2 className="vm-sheet-head-title" id="osc-creation-hp">
          Hit Points
        </h2>
      </div>
      <div className="u-row u-gap-3">
        <input
          className="osc-creation-hp-input vm-input vm-input-underline u-fs-3xl"
          type="text"
          inputMode="numeric"
          aria-label="Hit points"
          placeholder="—"
          value={text}
          aria-invalid={invalid || undefined}
          onChange={(event) =>
            onChange((d) => ({
              ...d,
              hitPoints: { value: event.target.value, formula },
            }))
          }
        />
        <div className="osc-creation-hp-dice u-flex-1">
          {hitPoints?.dice && <DiceRow dice={hitPoints.dice} />}
        </div>
        <button
          type="button"
          className={cx(
            "vm-btn vm-btn-sm u-flex-none",
            text ? "vm-btn-secondary" : "vm-btn-primary",
          )}
          aria-disabled={rolling || undefined}
          onClick={roll}
        >
          {text ? `Reroll ${row.hd}` : `Roll ${row.hd}`}
        </button>
      </div>
      {invalid ? (
        <p className="vm-field-error">Hit points start at 1</p>
      ) : (
        <p className="vm-help">{help}</p>
      )}
    </section>
  );
}

function ClassStats({
  draft,
  details,
  cls,
  race,
  scores,
  rules,
}: Pick<Props, "draft" | "details" | "cls" | "race" | "scores" | "rules">) {
  const asideRef = useRef<HTMLElement>(null);
  const { row, nextXp } = details;
  const slots = spellSlots(row);
  const wis = rules.modifiers(scores).wis;
  const racial = race && raceSaveBonus(race, scores);
  const notes = [
    ...(wis ? [`${formatModifier(wis)} vs magic (WIS ${scores.wis})`] : []),
    ...(racial?.bonus ? [`${racial.summary} (${racial.basis})`] : []),
  ];
  const stats: [string, string][] = [
    ["Experience", `${row.xp.toLocaleString()} xp`],
    ["Next level", nextXp === null ? "—" : `${nextXp.toLocaleString()} xp`],
    ["Hit dice", row.hd],
    ["THAC0", `${row.thac0} [${formatModifier(19 - row.thac0)}]`],
    ...(row.spells
      ? ([
          [
            "Spell slots",
            slots.length
              ? slots.map((s) => `${s.level} ${s.count}`).join(" · ")
              : "None yet",
          ],
        ] as [string, string][])
      : []),
    ["Max level", ordinal(details.cap)],
  ];
  return (
    <aside
      ref={asideRef}
      className="osc-creation-aside osc-creation-class-aside u-stack"
      aria-label={`${cls.name} at level ${details.level}`}
    >
      <div className="vm-sheet-head">
        <h2 className="vm-sheet-head-title">
          {race ? `${race.name} ${cls.name}` : cls.name} · level {details.level}
        </h2>
      </div>
      <dl className="u-grid u-grid-2 u-gap-x-4 u-gap-y-3">
        {stats.map(([label, value]) => (
          <div key={label} className="u-flex tw:flex-col u-gap-1">
            <dt className="vm-key">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <h3 className="vm-heading vm-heading-sm">Saving throws</h3>
      <dl
        className="osc-creation-saves u-flex tw:flex-col"
        aria-label="Saving throws, roll d20 at or above target"
      >
        {SAVES.map((name, i) => (
          <div
            key={name}
            className="osc-creation-save u-flex u-items-baseline u-justify-between u-gap-3 u-py-1"
          >
            <dt className="vm-key">{name}</dt>
            <dd className="osc-creation-save-target u-fs-2xl">
              {row.saves[i]}
            </dd>
          </div>
        ))}
      </dl>
      {notes.length > 0 && <p className="vm-help">{notes.join(" · ")}</p>}
      <AlignmentDescription
        alignment={draft.alignment}
        alignmentText={rules.alignmentText}
      />
      <MoreBelow scroller={asideRef} contentKey={details.level} />
    </aside>
  );
}

export function DetailsStep(props: Props) {
  const { draft, details, cls, rules, onChange } = props;
  const paneRef = useRef<HTMLDivElement>(null);
  return (
    <div className="osc-creation-split osc-creation-class-step">
      <div
        ref={paneRef}
        className="osc-creation-pane osc-creation-details-pane u-gap-4"
      >
        <div className="osc-creation-identity u-grid u-gap-5 u-items-start">
          <label className="vm-field u-gap-1">
            <span className="vm-key">Name</span>
            <input
              className="vm-input vm-input-underline vm-input-title"
              type="text"
              value={draft.name}
              onChange={(event) =>
                onChange((d) => ({ ...d, name: event.target.value }))
              }
            />
          </label>
          <LevelStepper
            level={details.level}
            cap={details.cap}
            onLevel={(level) => onChange((d) => ({ ...d, level }))}
          />
        </div>
        <div className="osc-creation-vitals u-grid u-gap-x-6">
          <AlignmentSection draft={draft} onChange={onChange} />
          <HitPointsSection
            details={details}
            cls={cls}
            rules={rules}
            onChange={onChange}
          />
        </div>
        <MoreBelow scroller={paneRef} contentKey={details.level} />
      </div>
      <ClassStats {...props} />
    </div>
  );
}
