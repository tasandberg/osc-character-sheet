import type { ReactNode } from "react";
import { useOscSheetContext } from "@app/context";
import { IconButton } from "@ui/IconButton";
import { InlineButton } from "@ui/InlineButton";
import { InlineEditValue } from "@ui/InlineEditValue";
import { Combobox } from "@ui/Combobox";
import { DisclosureRow, RowIcon } from "@ui/DisclosureRow";
import { Tag } from "@ui/Tag";
import { effectsLabel } from "@features/effects/effects";
import {
  availableClassNames,
  selectClassDefaults,
  selectProgression,
  selectUntabledNextXp,
} from "@domain/classRules";
import type { OSEActor, OseClassItem, OseRaceItem } from "@domain/types";
import { classFace } from "./classFace";

const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n}%`;
const fmtNum = (n: number) => n.toLocaleString();

const LIST = "tw:grid tw:grid-cols-[minmax(0,1fr)_repeat(4,auto)]";
const ROW =
  "tw:col-span-full tw:grid tw:grid-cols-subgrid tw:items-center u-gap-y-1 tw:not-first:border-t tw:border-t-border-soft";
const CELL = "tw:pl-3 tw:@max-md/app:pl-2 tw:@max-md/app:row-start-2";
const COL = {
  xp: `${CELL} tw:col-start-2 tw:justify-self-end`,
  bonus: `${CELL} tw:col-start-3 tw:justify-self-end`,
  hd: `${CELL} tw:col-start-4 tw:justify-self-end`,
  remove:
    "tw:pl-3 tw:col-start-5 tw:justify-self-end tw:@max-md/app:row-start-1",
};
const NAME =
  "tw:max-w-full tw:cursor-pointer tw:truncate tw:p-0 tw:text-left tw:font-semibold tw:text-(length:--fs-lg) tw:text-text tw:transition-[color] tw:duration-[120ms] tw:hover:text-gold tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2 tw:focus-visible:outline-gold";
const STAT = "u-inline-flex u-items-baseline u-gap-1 u-nowrap u-fs-md";
const STACKED = "tw:col-start-1 tw:row-start-1";
const SIZER = `${STACKED} tw:invisible`;

type Item = OseClassItem | OseRaceItem;

const INFO =
  "u-row u-gap-2 tw:col-start-1 tw:min-w-0 tw:@max-md/app:col-end-5 tw:@max-md/app:row-start-1";

function ItemInfo({ item, aside }: { item: Item; aside?: ReactNode }) {
  return (
    <div className={INFO}>
      <RowIcon large img={item.img} name={item.name ?? ""} />
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
  placeholder,
  inline = false,
  onCommit,
}: {
  label: string;
  value: string;
  editValue?: string;
  placeholder?: string;
  inline?: boolean;
  onCommit?: (next: string) => void;
}) {
  return (
    <span
      className={`tw:inline-grid tw:whitespace-nowrap ${inline ? "tw:justify-items-start" : "tw:justify-items-end"}`}
    >
      <span className={SIZER} aria-hidden="true">
        {value}
      </span>
      <span className={SIZER} aria-hidden="true">
        {editValue || placeholder}
      </span>
      <InlineEditValue
        label={label}
        value={value}
        editValue={editValue}
        placeholder={placeholder}
        className={`${EDIT_TEXT} ${STACKED}`}
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
  inline,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  inline?: boolean;
  canEdit: boolean;
  onCommit: (n: number) => void;
}) {
  return (
    <FitValue
      label={label}
      value={fmtNum(value)}
      editValue={String(value)}
      inline={inline}
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

function HitDiceValue({
  value,
  canEdit,
  onCommit,
}: {
  value: string;
  canEdit: boolean;
  onCommit: (hd: string) => void;
}) {
  return (
    <FitValue
      label="Hit Dice"
      value={value}
      placeholder="—"
      onCommit={
        canEdit
          ? (v) => {
              if (validHitDice(v)) onCommit(v);
            }
          : undefined
      }
    />
  );
}

function NextXpValue({
  value,
  canEdit,
  onCommit,
}: {
  value: number;
  canEdit: boolean;
  onCommit: (n: number) => void;
}) {
  return (
    <>
      <span className="u-text-dim">/</span>
      <IntValue
        label="Next level XP"
        value={value}
        min={0}
        canEdit={canEdit}
        onCommit={onCommit}
      />
    </>
  );
}

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

const promptsForAbilities = () => {
  try {
    const settings = game.settings as {
      get(ns: string, key: string): unknown;
    };
    return settings.get(game.system.id, "promptAddClassAbilities") !== false;
  } catch {
    return true;
  }
};

function AddAbilitiesButton({
  actor,
  item,
}: {
  actor: OSEActor;
  item: OseClassItem;
}) {
  const { offerAbilities } = actor;
  const { level } = item.system;
  if (!offerAbilities) return null;
  return (
    <InlineButton
      variant="link"
      size="sm"
      className="u-nowrap u-flex-none"
      aria-label={`Add missing abilities for ${item.name}`}
      title={`Add missing abilities for ${item.name}`}
      onClick={() =>
        void offerAbilities.call(actor, item, level, {
          upTo: true,
          confirm: promptsForAbilities(),
        })
      }
    >
      Add missing abilities
    </InlineButton>
  );
}

function KindTag({ children }: { children: ReactNode }) {
  return (
    <Tag size="xs" className="u-flex-none">
      {children}
    </Tag>
  );
}

function LevelText({ children }: { children: ReactNode }) {
  return <span className="u-nowrap u-fs-md u-text-dim">Level {children}</span>;
}

function ClassRow({
  actor,
  item,
  canEdit,
  missingAbilities,
  set,
}: {
  actor: OSEActor;
  item: OseClassItem;
  canEdit: boolean;
  missingAbilities: boolean;
  set: (key: string, value: string | number) => void;
}) {
  const { level, xp, nextRow, canLevelUp } = item.system;
  const next = nextRow?.xp ?? null;
  const untabledNext =
    actor.system.classes?.[0] === item ? selectUntabledNextXp(actor) : null;
  const ownsHitDice =
    !item.system.levels?.length && !actor.system.derivedFromClasses;
  const bonus =
    (actor.system.classXpBonus?.(item) ?? 0) +
    (actor.system.xpBonusFromEffects ?? 0);
  return (
    <div className={ROW}>
      <ItemInfo
        item={item}
        aside={
          <>
            <KindTag>{effectsLabel("OSE.details.class")}</KindTag>
            <LevelText>
              <IntValue
                label={`${item.name} level`}
                inline
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
            {canEdit && missingAbilities && (
              <AddAbilitiesButton actor={actor} item={item} />
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
        {untabledNext != null ? (
          <NextXpValue
            value={untabledNext}
            canEdit={canEdit}
            onCommit={(n) => set("system.details.xp.next", n)}
          />
        ) : (
          next != null && (
            <span className="u-text-dim tw:tabular-nums">/ {fmtNum(next)}</span>
          )
        )}
      </Stat>
      {ownsHitDice && (
        <Stat label="HD" className={COL.hd}>
          <HitDiceValue
            value={actor.system.hp.hd}
            canEdit={canEdit}
            onCommit={(v) => set("system.hp.hd", v)}
          />
        </Stat>
      )}
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
        aside={<KindTag>{game.i18n.localize("OSC.details.race")}</KindTag>}
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
  const { details } = actor.system;
  const isGM = game.user?.isGM ?? false;
  const defaults = selectClassDefaults(actor);
  const hitDice = actor.system.hp.hd || defaults.hd || `${details.level}d8`;
  const next = defaults.nextXp;
  return (
    <div className={ROW}>
      <div className={INFO}>
        <RowIcon large name={details.class} />
        {canEdit && isGM ? (
          <label className="u-flex-1 tw:min-w-0">
            <span className="tw:sr-only">Class</span>
            <Combobox
              variant="inline"
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
        ) : (
          <span className="u-row u-gap-2 tw:min-w-0 tw:font-semibold u-fs-lg u-text">
            {classFace(details.class)}
          </span>
        )}
        <LevelText>
          <IntValue
            label="Level"
            inline
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
        {defaults.matched ? (
          next != null && (
            <span className="u-text-dim tw:tabular-nums">/ {fmtNum(next)}</span>
          )
        ) : (
          <NextXpValue
            value={details.xp.next ?? 0}
            canEdit={canEdit}
            onCommit={(n) => set("system.details.xp.next", n)}
          />
        )}
      </Stat>
      <Stat label="HD" className={COL.hd}>
        <HitDiceValue
          value={hitDice}
          canEdit={canEdit}
          onCommit={(v) => set("system.hp.hd", v)}
        />
      </Stat>
      {details.xp.bonus ? (
        <span className={`${COL.bonus} u-fs-xs u-text-brass`} title="XP bonus">
          {fmtPct(details.xp.bonus)}
        </span>
      ) : null}
    </div>
  );
}

export function GrantingItemHeader({
  item,
  missingAbilities = false,
  expanded,
  onToggle,
}: {
  item: OseClassItem | OseRaceItem;
  missingAbilities?: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { actor, updateActor, canEdit } = useOscSheetContext();
  const set = (key: string, value: string | number) =>
    void updateActor({ [key]: value });
  const label = `${expanded ? "Collapse" : "Expand"} ${item.name} abilities`;
  return (
    <DisclosureRow label={label} expanded={expanded} onToggle={onToggle}>
      <div className={`${LIST} u-flex-1`}>
        {item.type === "race" ? (
          <RaceRow actor={actor} race={item as OseRaceItem} canEdit={canEdit} />
        ) : (
          <ClassRow
            actor={actor}
            item={item as OseClassItem}
            canEdit={canEdit}
            missingAbilities={missingAbilities}
            set={set}
          />
        )}
      </div>
    </DisclosureRow>
  );
}

export function IdentitySection() {
  const { actor, updateActor, canEdit } = useOscSheetContext();
  const { race } = selectProgression(actor);
  const set = (key: string, value: string | number) =>
    void updateActor({ [key]: value });

  return (
    <section className="osc-section" aria-label="Class">
      <div className={`${LIST} tw:*:py-1`}>
        <ActorClassRow actor={actor} canEdit={canEdit} set={set} />
        {race && <RaceRow actor={actor} race={race} canEdit={canEdit} />}
      </div>
    </section>
  );
}
