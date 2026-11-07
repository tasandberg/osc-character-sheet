import { useState, type ReactNode } from "react";
import { useOscSheetContext } from "@app/context";
import { SectionTitle } from "@ui/SectionTitle";
import { IconButton } from "@ui/IconButton";
import { InlineEditValue } from "@ui/InlineEditValue";
import { Combobox } from "@ui/Combobox";
import { Monogram } from "@ui/Monogram";
import { OverrideValue } from "@ui/OverrideValue";
import { ConfirmDialog } from "@ui/ConfirmDialog";
import {
  availableClassNames,
  selectClassDefaults,
  selectProgression,
} from "@domain/classRules";
import type { OSEActor, OseClassItem, OseRaceItem } from "@domain/types";
import { classFace } from "./classFace";

const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n}%`;
const fmtNum = (n: number) => n.toLocaleString();

const LIST = "tw:grid tw:grid-cols-[minmax(0,1fr)_repeat(4,auto)]";
const ROW =
  "tw:col-span-full tw:grid tw:grid-cols-subgrid tw:items-center u-gap-y-1 u-py-2 tw:not-first:border-t tw:border-t-border-soft";
const CELL = "tw:pl-3 tw:@max-md/app:pl-2 tw:@max-md/app:row-start-2";
const COL = {
  xp: `${CELL} tw:col-start-2`,
  bonus: `${CELL} tw:col-start-3 tw:justify-self-end`,
  hd: `${CELL} tw:col-start-4`,
  reset: `${CELL} tw:col-start-5 tw:justify-self-end`,
  remove:
    "tw:pl-3 tw:col-start-5 tw:justify-self-end tw:@max-md/app:row-start-1",
};
const ICON =
  "tw:grid tw:size-8 tw:flex-none tw:place-items-center tw:bg-ink tw:font-semibold tw:text-(length:--fs-md) tw:text-stamp-text";
const NAME =
  "tw:max-w-full tw:cursor-pointer tw:truncate tw:p-0 tw:text-left tw:font-semibold tw:text-(length:--fs-md) tw:text-text tw:transition-[color] tw:duration-[120ms] tw:hover:text-gold tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2 tw:focus-visible:outline-gold";
const STAT =
  "u-flex u-items-baseline u-justify-between u-gap-2 u-nowrap u-fs-md";

type Item = OseClassItem | OseRaceItem;

const monogram = (name: string) => (name.trim().charAt(0) || "?").toUpperCase();

const INFO =
  "u-row u-gap-3 tw:col-start-1 tw:min-w-0 tw:@max-md/app:col-end-5 tw:@max-md/app:row-start-1";

function ItemInfo({ item, aside }: { item: Item; aside?: ReactNode }) {
  return (
    <div className={INFO}>
      <Monogram
        img={item.img}
        monogram={monogram(item.name ?? "")}
        className={ICON}
        imgClassName="tw:object-cover"
      />
      <div className="u-row u-gap-2 u-flex-1 tw:min-w-0">
        <button
          type="button"
          className={NAME}
          title={`Open ${item.name}`}
          onClick={() => void item.sheet?.render(true)}
        >
          {item.name}
        </button>
        {aside}
      </div>
    </div>
  );
}

function Stat({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <span className={`${STAT} ${className}`}>
      <span className="u-fs-xs u-text-dim tw:font-semibold">{label}</span>
      <span className="u-inline-flex u-items-baseline u-gap-1 tw:tabular-nums">
        {children}
      </span>
    </span>
  );
}

const EDIT_TEXT =
  "tw:inline-block tw:p-0 tw:m-0 tw:border-0 tw:whitespace-nowrap tw:overflow-visible tw:[font:inherit] tw:tabular-nums";

function FitValue({
  label,
  value,
  editValue = value,
  onCommit,
}: {
  label: string;
  value: string;
  editValue?: string;
  onCommit?: (next: string) => void;
}) {
  const chars = Math.max(2, value.length, editValue.length) + 1;
  return (
    <span
      className="tw:inline-block tw:text-right tw:whitespace-nowrap"
      style={{ width: `${chars}ch` }}
    >
      <InlineEditValue
        label={label}
        value={value}
        editValue={editValue}
        className={EDIT_TEXT}
        onCommit={onCommit}
      />
    </span>
  );
}

function IntValue({
  label,
  value,
  min,
  canEdit,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  canEdit: boolean;
  onCommit: (n: number) => void;
}) {
  return (
    <FitValue
      label={label}
      value={fmtNum(value)}
      editValue={String(value)}
      onCommit={
        canEdit
          ? (next) => {
              const n = Number.parseInt(next, 10);
              if (Number.isFinite(n)) onCommit(Math.max(min, n));
            }
          : undefined
      }
    />
  );
}

const validHitDice = (v: string) => /d\d/i.test(v) && Roll.validate(v);

function DeleteButton({ item, actor }: { item: Item; actor: OSEActor }) {
  return (
    <span className={COL.remove}>
      <IconButton
        variant="danger"
        size="sm"
        title={`Remove ${item.name}`}
        aria-label={`Remove ${item.name}`}
        onClick={() => void actor.removeGrantingItem(item)}
      >
        <i className="fa-solid fa-trash-can" aria-hidden="true" />
      </IconButton>
    </span>
  );
}

function LevelUpButton({
  item,
  onLevelUp,
}: {
  item: OseClassItem;
  onLevelUp: () => void;
}) {
  return (
    <IconButton
      variant="raised"
      className="osc-roll-button osc-icon-tone-brass u-flex-none"
      aria-label={`Level up ${item.name}`}
      title={`Level up ${item.name}`}
      onClick={onLevelUp}
    >
      <i className="fa-solid fa-circle-up" aria-hidden="true" />
      <span className="tw:@max-md/app:hidden">Level up</span>
    </IconButton>
  );
}

function LevelText({ children }: { children: ReactNode }) {
  return (
    <span className="u-inline-flex u-items-baseline u-gap-1 u-nowrap u-fs-md u-text-dim">
      Level {children}
    </span>
  );
}

function ClassRow({
  actor,
  item,
  canEdit,
}: {
  actor: OSEActor;
  item: OseClassItem;
  canEdit: boolean;
}) {
  const { level, xp, nextRow, canLevelUp } = item.system;
  const next = nextRow?.xp ?? null;
  const bonus =
    (actor.system.classXpBonus?.(item) ?? 0) +
    (actor.system.xpBonusFromEffects ?? 0);
  return (
    <div className={ROW}>
      <ItemInfo
        item={item}
        aside={
          <>
            <LevelText>
              <IntValue
                label={`${item.name} level`}
                value={level}
                min={1}
                canEdit={canEdit}
                onCommit={(n) => void item.update({ "system.level": n })}
              />
            </LevelText>
            {canEdit && canLevelUp && (
              <LevelUpButton
                item={item}
                onLevelUp={() => void actor.levelUp(item)}
              />
            )}
          </>
        }
      />
      <Stat label="XP" className={COL.xp}>
        <IntValue
          label={`${item.name} XP`}
          value={xp}
          min={0}
          canEdit={canEdit}
          onCommit={(n) => void item.update({ "system.xp": n })}
        />
        {next != null && (
          <span className="u-text-dim tw:tabular-nums">/ {fmtNum(next)}</span>
        )}
      </Stat>
      {bonus !== 0 && (
        <span className={`${COL.bonus} u-fs-xs u-text-brass`} title="XP bonus">
          {fmtPct(bonus)}
        </span>
      )}
      {canEdit && <DeleteButton item={item} actor={actor} />}
    </div>
  );
}

function RaceRow({
  actor,
  race,
  canEdit,
}: {
  actor: OSEActor;
  race: OseRaceItem;
  canEdit: boolean;
}) {
  return (
    <div className={ROW}>
      <ItemInfo
        item={race}
        aside={<span className="u-fs-md u-text-dim u-nowrap">Race</span>}
      />
      {canEdit && <DeleteButton item={race} actor={actor} />}
    </div>
  );
}

function ActorClassRow({
  actor,
  canEdit,
  set,
}: {
  actor: OSEActor;
  canEdit: boolean;
  set: (key: string, value: string | number) => void;
}) {
  const [resetTo, setResetTo] = useState<number | null>(null);
  const { details } = actor.system;
  const isGM = game.user?.isGM ?? false;
  const defaults = selectClassDefaults(actor);
  const defaultNext = defaults.nextXp;
  const hitDice = actor.system.hp.hd || defaults.hd || `${details.level}d8`;
  const next = details.xp.next ?? 0;
  return (
    <div className={ROW}>
      <div className={INFO}>
        <span className={ICON} aria-hidden="true">
          {monogram(details.class)}
        </span>
        <label className="u-flex-1 tw:min-w-0">
          <span className="tw:sr-only">Class</span>
          <Combobox
            disabled={!canEdit || !isGM}
            value={details.class}
            options={availableClassNames().map((c) => ({
              value: c,
              label: c.replace(/-/g, " "),
              node: classFace(c),
            }))}
            onCommit={(v) => set("system.details.class", v)}
            renderValue={classFace}
            createHint="Type to set a custom class"
            newOptionLabel={(q) => `Custom: “${q}”`}
          />
        </label>
        <LevelText>
          <IntValue
            label="Level"
            value={details.level}
            min={1}
            canEdit={canEdit}
            onCommit={(n) => set("system.details.level", n)}
          />
        </LevelText>
      </div>
      <Stat label="XP" className={COL.xp}>
        <IntValue
          label="XP"
          value={details.xp.value}
          min={0}
          canEdit={canEdit}
          onCommit={(n) => set("system.details.xp.value", n)}
        />
        <span className="u-text-dim">/</span>
        <IntValue
          label="Next level XP"
          value={next}
          min={0}
          canEdit={canEdit}
          onCommit={(n) => set("system.details.xp.next", n)}
        />
      </Stat>
      <Stat label="HD" className={COL.hd}>
        <FitValue
          label="Hit Dice"
          value={hitDice}
          onCommit={
            canEdit
              ? (v) => {
                  if (validHitDice(v)) set("system.hp.hd", v);
                }
              : undefined
          }
        />
      </Stat>
      {details.xp.bonus ? (
        <span className={`${COL.bonus} u-fs-xs u-text-brass`} title="XP bonus">
          {fmtPct(details.xp.bonus)}
        </span>
      ) : null}
      {canEdit && defaultNext != null && details.xp.next !== defaultNext && (
        <OverrideValue
          className={COL.reset}
          overridden
          defaultText={`default · ${fmtNum(defaultNext)}`}
          onResetRequest={() => setResetTo(defaultNext)}
        />
      )}
      <ConfirmDialog
        open={resetTo != null}
        title="Reset Next Level?"
        body={`Revert to the class default of ${fmtNum(resetTo ?? 0)} XP.`}
        confirmLabel="Reset"
        onConfirm={() => {
          if (resetTo != null) set("system.details.xp.next", resetTo);
          setResetTo(null);
        }}
        onCancel={() => setResetTo(null)}
      />
    </div>
  );
}

export function IdentitySection() {
  const { actor, updateActor, canEdit } = useOscSheetContext();
  const { source, classes, race } = selectProgression(actor);
  const set = (key: string, value: string | number) =>
    void updateActor({ [key]: value });

  return (
    <section className="osc-section" aria-label="Identity">
      <SectionTitle hint={canEdit ? "click a value to edit" : undefined}>
        Identity
      </SectionTitle>
      <div className={LIST}>
        {source === "item" ? (
          classes.map((c) => (
            <ClassRow
              key={c.id ?? c.name}
              actor={actor}
              item={c}
              canEdit={canEdit}
            />
          ))
        ) : (
          <ActorClassRow actor={actor} canEdit={canEdit} set={set} />
        )}
        {race && <RaceRow actor={actor} race={race} canEdit={canEdit} />}
      </div>
    </section>
  );
}
