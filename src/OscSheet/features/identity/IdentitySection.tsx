import { useState, type ReactNode } from "react";
import { useOscSheetContext } from "@app/context";
import { SectionTitle } from "@ui/SectionTitle";
import { IconButton } from "@ui/IconButton";
import { InlineEditValue } from "@ui/InlineEditValue";
import { Combobox } from "@ui/Combobox";
import { Monogram } from "@ui/Monogram";
import { Tag } from "@ui/Tag";
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

const ROW =
  "u-row u-wrap u-gap-x-3 u-gap-y-1 u-py-2 tw:not-first:border-t tw:border-t-border-soft";
const ICON =
  "tw:grid tw:size-8 tw:flex-none tw:place-items-center tw:bg-ink tw:font-semibold tw:text-(length:--fs-md) tw:text-stamp-text";
const NAME =
  "tw:max-w-full tw:cursor-pointer tw:truncate tw:p-0 tw:text-left tw:font-semibold tw:text-(length:--fs-md) tw:text-text tw:transition-[color] tw:duration-[120ms] tw:hover:text-gold tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2 tw:focus-visible:outline-gold";
const PLAQUE = "icon-btn raised osc-roll-button u-nowrap";

type Item = OseClassItem | OseRaceItem;

const monogram = (name: string) => (name.trim().charAt(0) || "?").toUpperCase();

function ItemInfo({ item, aside }: { item: Item; aside?: ReactNode }) {
  return (
    <div className="u-row u-gap-3 u-flex-1 tw:min-w-[calc(var(--spacer-12)*3)]">
      <Monogram
        img={item.img}
        monogram={monogram(item.name ?? "")}
        className={ICON}
        imgClassName="tw:object-cover"
      />
      <div className="u-row u-gap-2 u-flex-1">
        <button
          type="button"
          className={NAME}
          title={`Open ${item.name}`}
          onClick={() => void item.sheet?.render(true)}
        >
          {item.name}
        </button>
        {aside && <span className="u-fs-md u-text-dim u-nowrap">{aside}</span>}
      </div>
    </div>
  );
}

function Plaque({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className={PLAQUE}>
      <span className="u-text-dim">{label}</span>
      {children}
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
    <InlineEditValue
      label={label}
      parse="int"
      value={fmtNum(value)}
      editValue={String(value)}
      className="tw:tabular-nums"
      onCommit={canEdit ? (n) => onCommit(Math.max(min, n)) : undefined}
    />
  );
}

function DeleteButton({ item, actor }: { item: Item; actor: OSEActor }) {
  return (
    <IconButton
      variant="danger"
      size="sm"
      title={`Remove ${item.name}`}
      aria-label={`Remove ${item.name}`}
      onClick={() => void actor.removeGrantingItem(item)}
    >
      <i className="fa-solid fa-trash-can" aria-hidden="true" />
    </IconButton>
  );
}

function Controls({ children }: { children: ReactNode }) {
  return (
    <div className="u-row u-gap-2 u-ml-auto u-justify-end u-wrap">
      {children}
    </div>
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
      <ItemInfo item={item} aside={level} />
      <Controls>
        <Plaque label="LV">
          <IntValue
            label={`${item.name} level`}
            value={level}
            min={1}
            canEdit={canEdit}
            onCommit={(n) => void item.update({ "system.level": n })}
          />
        </Plaque>
        <Plaque label="XP">
          <IntValue
            label={`${item.name} XP`}
            value={xp}
            min={0}
            canEdit={canEdit}
            onCommit={(n) => void item.update({ "system.xp": n })}
          />
          {next != null && <span className="u-text-dim">/ {fmtNum(next)}</span>}
        </Plaque>
        {bonus !== 0 && (
          <Tag intent="brass" size="xs" title="XP bonus">
            {fmtPct(bonus)}
          </Tag>
        )}
        {canEdit && canLevelUp && (
          <IconButton
            variant="raised"
            className="osc-roll-button osc-icon-tone-brass"
            aria-label={`Level up ${item.name}`}
            title={`Level up ${item.name}`}
            onClick={() => void actor.levelUp(item)}
          >
            <i className="fa-solid fa-circle-up" aria-hidden="true" />
            <span>Level up</span>
          </IconButton>
        )}
        {canEdit && <DeleteButton item={item} actor={actor} />}
      </Controls>
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
      <ItemInfo item={race} aside="Race" />
      {canEdit && (
        <Controls>
          <DeleteButton item={race} actor={actor} />
        </Controls>
      )}
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
  const defaultNext = selectClassDefaults(actor).nextXp;
  const next = details.xp.next ?? 0;
  return (
    <div className={ROW}>
      <div className="u-row u-gap-3 u-flex-1 tw:min-w-[calc(var(--spacer-12)*3)]">
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
      </div>
      <Controls>
        <Plaque label="LV">
          <IntValue
            label="Level"
            value={details.level}
            min={1}
            canEdit={canEdit}
            onCommit={(n) => set("system.details.level", n)}
          />
        </Plaque>
        <Plaque label="XP">
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
        </Plaque>
        {details.xp.bonus ? (
          <Tag intent="brass" size="xs" title="XP bonus">
            {fmtPct(details.xp.bonus)}
          </Tag>
        ) : null}
        {canEdit && defaultNext != null && details.xp.next !== defaultNext && (
          <OverrideValue
            overridden
            defaultText={`default · ${fmtNum(defaultNext)}`}
            onResetRequest={() => setResetTo(defaultNext)}
          />
        )}
      </Controls>
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
  const storedTitle =
    actor._source?.system?.details?.title ?? actor.system.details.title;

  return (
    <section className="osc-section" aria-label="Identity">
      <SectionTitle hint={canEdit ? "click a value to edit" : undefined}>
        Identity
      </SectionTitle>
      <div className="tw:flex tw:flex-col">
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
        <div className={ROW}>
          <span className="u-fs-xs u-text-dim tw:uppercase tw:tracking-[0.09em] tw:font-semibold">
            Title
          </span>
          <InlineEditValue
            label="Title"
            value={storedTitle}
            placeholder={actor.system.details.title || "—"}
            onCommit={
              canEdit ? (v) => set("system.details.title", v) : undefined
            }
          />
        </div>
      </div>
    </section>
  );
}
