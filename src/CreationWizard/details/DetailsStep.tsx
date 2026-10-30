import { useRef, useState } from "react";
import { cx } from "@ui/cx";
import { VellumSegmented } from "@features/settings/controls";
import { MoreBelow } from "../MoreBelow";
import { RecordRows, type RecordRow } from "../RecordRows";
import { PortraitPicker } from "../portrait/PortraitPicker";
import { ordinal, type CreationRace } from "../race/raceDraft";
import type {
  Alignment,
  AlignmentText,
  CreationClass,
  CreationRules,
} from "../rules";
import { formatModifier, scoreFaceClass } from "../scores/scoreFace";
import { DiceRow } from "../scores/ScoreTile";
import type { AbilityScores } from "../scores/scoresDraft";
import { useCompendiumDetail } from "../useCompendiumDetail";
import { raceSaveBonus } from "../upstreamGaps";
import {
  ALIGNMENTS,
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
  const step = (to: number) => {
    if (to >= 1 && to <= cap) onLevel(to);
  };
  return (
    <div
      className="osc-creation-level-stepper vm-stepper"
      role="group"
      aria-label="Level"
    >
      <button
        type="button"
        className="vm-stepper-btn"
        aria-label="Lower level"
        aria-disabled={level <= 1}
        onClick={() => step(level - 1)}
      >
        <i className="fa-solid fa-minus u-fs-3xs" aria-hidden="true" />
      </button>
      <output className="vm-stepper-value u-fs-lg" aria-live="polite">
        {level}
      </output>
      <button
        type="button"
        className="vm-stepper-btn"
        aria-label="Raise level"
        aria-disabled={level >= cap}
        onClick={() => step(level + 1)}
      >
        <i className="fa-solid fa-plus u-fs-3xs" aria-hidden="true" />
      </button>
    </div>
  );
}

function AlignmentSection({
  draft,
  alignmentText,
  onChange,
}: Pick<Props, "draft" | "onChange"> & {
  alignmentText: () => Promise<AlignmentText>;
}) {
  const loaded = useCompendiumDetail("alignment", alignmentText);
  const chosen = ALIGNMENTS.find((a) => a.value === draft.alignment);
  const text =
    chosen && loaded.status === "ready"
      ? loaded.detail[chosen.value]
      : undefined;
  return (
    <section
      className="osc-creation-alignment vm-field u-gap-2 u-pt-4"
      aria-labelledby="osc-creation-al"
    >
      <span className="vm-key" id="osc-creation-al">
        Alignment
      </span>
      <VellumSegmented
        full
        label="Alignment"
        options={ALIGNMENTS}
        value={draft.alignment as Alignment}
        onChange={(alignment) => onChange((d) => ({ ...d, alignment }))}
      />
      {!chosen ? (
        <p className="vm-help u-text-muted osc-creation-measure">
          Choose Lawful, Neutral or Chaotic. Alignment sets your
          character&apos;s outlook and the alignment language they speak.
        </p>
      ) : text ? (
        <p className="vm-flavor osc-creation-measure">{text}</p>
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
  rules,
  onChange,
}: Pick<Props, "details" | "rules" | "onChange">) {
  const [rolling, setRolling] = useState(false);
  const { stats, formula, hitPoints } = details;
  const text = hitPoints?.value ?? "";
  const invalid = text.trim() !== "" && parseHitPoints(text) === undefined;

  const roll = async () => {
    if (rolling) return;
    setRolling(true);
    try {
      const result = await rules.rollHitPoints(
        formula,
        `Hit points (${stats.hd})`,
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
    <section className="vm-field u-gap-1" aria-labelledby="osc-creation-hp">
      <span className="vm-key" id="osc-creation-hp">
        Hit Points
      </span>
      <div className="u-flex u-flex-1 u-items-center u-gap-3">
        <span
          className={cx(
            scoreFaceClass(invalid && "vm-score-face-invalid"),
            "osc-creation-hp-well u-flex-none",
          )}
        >
          <input
            className="vm-score-figure vm-score-input"
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
        </span>
        <button
          type="button"
          className={cx(
            "vm-btn vm-btn-sm osc-creation-nowrap",
            text ? "vm-btn-secondary" : "vm-btn-primary",
          )}
          aria-disabled={rolling || undefined}
          onClick={roll}
        >
          {text ? `Reroll ${stats.hd}` : `Roll ${stats.hd}`}
        </button>
        <span className="osc-creation-hp-dice">
          {hitPoints?.dice ? (
            <DiceRow dice={hitPoints.dice} />
          ) : (
            <span className="vm-score-dice" aria-hidden="true">
              {Array.from({ length: parseInt(stats.hd) || 1 }, (_, i) => (
                <span key={i} className="vm-score-die u-text-muted">
                  —
                </span>
              ))}
            </span>
          )}
        </span>
      </div>
    </section>
  );
}

function HitPointsHelp({ details, cls }: Pick<Props, "details" | "cls">) {
  const { stats, conBonus, hitPoints } = details;
  const text = hitPoints?.value ?? "";
  const invalid = text.trim() !== "" && parseHitPoints(text) === undefined;
  const con = conBonus ? `, ${formatModifier(conBonus)} for Constitution` : "";
  const help = hitPoints?.dice
    ? `Rolled ${stats.hd} for ${cls.name}${con}.`
    : hitPoints?.maximum
      ? `Maximum of ${stats.hd} for ${cls.name}${con}, by house rule.`
      : `${cls.name} hit dice ${stats.hd}${con}.`;
  return invalid ? (
    <p className="vm-field-error">Hit points start at 1</p>
  ) : (
    <p className="vm-help">{help}</p>
  );
}

function ClassStats({ details, cls, race, scores, rules }: Props) {
  const asideRef = useRef<HTMLElement>(null);
  const { stats } = details;
  const slots = spellSlots(stats);
  const wis = rules.modifiers(scores).wis;
  const racial = race && raceSaveBonus(race, scores);
  const notes = [
    ...(wis ? [`${formatModifier(wis)} vs magic (WIS ${scores.wis})`] : []),
    ...(racial?.bonus ? [`${racial.summary} (${racial.basis})`] : []),
  ];
  const rows: RecordRow[] = [
    ["Experience", `${stats.xp.toLocaleString()} xp`],
    [
      "Next level",
      stats.nextXp === null ? "—" : `${stats.nextXp.toLocaleString()} xp`,
    ],
    ["Max level", ordinal(details.cap)],
    ["Hit dice", stats.hd],
    ["THAC0", `${stats.thac0} [${formatModifier(stats.bba)}]`],
    ...(cls.casts
      ? ([
          [
            "Spell slots",
            slots.length
              ? slots.map((s) => `${s.level} ${s.count}`).join(" · ")
              : "None yet",
          ],
        ] as RecordRow[])
      : []),
  ];

  return (
    <aside
      ref={asideRef}
      className="osc-creation-aside osc-creation-class-aside u-stack u-gap-3"
      aria-label={`${cls.name} at level ${details.level}`}
    >
      <div className="vm-sheet-head">
        <h2 className="vm-sheet-head-title">
          {race ? `${race.name} ${cls.name}` : cls.name}{" "}
          <span className="tw:font-sans tw:font-normal u-fs-sm u-text-muted">
            · level {details.level}
          </span>
        </h2>
      </div>
      <RecordRows rows={rows} />
      <h3 className="vm-heading vm-heading-sm u-fs-lg u-mt-1">Saving throws</h3>
      <RecordRows
        rows={rules.saveNames.map((name, i) => [name, stats.saves[i]])}
        aria-label="Saving throws, roll d20 at or above target"
      />
      {notes.length > 0 && <p className="vm-help">{notes.join(" · ")}</p>}
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
        className="osc-creation-pane osc-creation-details-pane u-gap-5"
      >
        <div className="vm-sheet-head">
          <h2 className="vm-sheet-head-title">Character Details</h2>
        </div>
        <div className="osc-creation-identity u-grid u-gap-5 u-items-start">
          <div className="vm-field u-gap-1">
            <span className="vm-key">Portrait</span>
            <PortraitPicker
              draft={draft.portrait}
              onChange={(portrait) => onChange((d) => ({ ...d, portrait }))}
            />
          </div>
          <div className="u-flex tw:flex-col u-gap-3 tw:min-w-0">
            <label className="vm-field u-gap-1">
              <span className="vm-key">Name</span>
              <input
                className="vm-input vm-input-underline vm-input-title"
                type="text"
                placeholder="Character name"
                value={draft.name}
                onChange={(event) =>
                  onChange((d) => ({ ...d, name: event.target.value }))
                }
              />
            </label>
            <div className="osc-creation-identity-row u-grid u-gap-8">
              <div className="vm-field u-gap-1">
                <span className="vm-key" aria-hidden="true">
                  Level
                </span>
                <div className="osc-creation-identity-control u-flex u-flex-1 u-items-center">
                  <LevelStepper
                    level={details.level}
                    cap={details.cap}
                    onLevel={(level) => onChange((d) => ({ ...d, level }))}
                  />
                </div>
              </div>
              <HitPointsSection
                details={details}
                rules={rules}
                onChange={onChange}
              />
            </div>
            <HitPointsHelp details={details} cls={cls} />
          </div>
        </div>
        <AlignmentSection
          draft={draft}
          alignmentText={rules.alignmentText}
          onChange={onChange}
        />
        <MoreBelow scroller={paneRef} contentKey={details.level} />
      </div>
      <ClassStats {...props} />
    </div>
  );
}
