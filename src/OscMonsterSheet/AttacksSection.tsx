import { useState, type MouseEvent } from "react";
import { createOwnedItem } from "@domain/createOwnedItem";
import type { OSEActor } from "@domain/types";
import {
  ContextMenu,
  type ContextMenuEntry,
  type ContextMenuState,
} from "@ui/ContextMenu";
import { IconButton } from "@ui/IconButton";
import { PatternPip } from "@ui/PatternPip";
import type { Anchor } from "@ui/useFixedAnchor";
import { Pips } from "@ui/Pips";
import { SectionTitle } from "@ui/SectionTitle";
import { Tag } from "@ui/Tag";
import { cx } from "@ui/cx";
import {
  cyclePattern,
  resetAttacks,
  rollMonsterItem,
  setAttacksPerRound,
  setPattern,
  setUses,
} from "./actions";
import { itemMenu } from "./parts/itemMenu";
import { RollLabel } from "@ui/RollLabel";
import { InlineEditValue } from "@ui/InlineEditValue";
import type { MonsterActor, MonsterItem } from "./types";
import { EMPTY_VALUE, type AttackGroup, type AttackRow } from "./viewModel";

type Props = {
  actor: MonsterActor;
  groups: AttackGroup[];
  canEdit: boolean;
};

function patternEntries(item: MonsterItem): ContextMenuEntry[] {
  const colours = Object.entries(CONFIG.OSE?.colors ?? {}).map(
    ([pattern, label]) => ({ pattern, label: game.i18n.localize(label) }),
  );
  return [...colours, { pattern: "transparent", label: "None" }].map(
    ({ pattern, label }) => ({
      label,
      checked: (item.system.pattern ?? "transparent") === pattern,
      onSelect: () => void setPattern(item, pattern),
    }),
  );
}

const MAX_PIPS = 6;

function Uses({
  name,
  uses,
  onSet,
  onSetMax,
}: {
  name: string;
  uses: { value: number; max: number } | null;
  onSet?: (value: number) => void;
  onSetMax?: (max: number) => void;
}) {
  const max = uses?.max ?? 0;
  const maxField = onSetMax && (
    <InlineEditValue
      label={`${name} attacks per round`}
      value={max ? String(max) : ""}
      placeholder={EMPTY_VALUE}
      parse="int"
      onCommit={onSetMax}
    />
  );
  if (!uses) return maxField ?? null;
  if (max > MAX_PIPS) {
    return (
      <span className="osc-monster-value u-fs-xs">
        <InlineEditValue
          label={`${name} uses left`}
          value={String(uses.value)}
          parse="int"
          onCommit={onSet && ((next) => onSet(Math.min(next, max)))}
        />
        /{maxField ?? max}
      </span>
    );
  }
  const pips = (
    <Pips
      total={max}
      filled={uses.value}
      size="xs"
      tone="ink"
      square
      role="group"
      aria-label={`${name}: ${uses.value} of ${max} uses left`}
      onSetFilled={onSet}
    />
  );
  if (!maxField) return pips;
  return (
    <span className="u-row u-gap-1">
      {pips}
      <span className="osc-monster-value u-fs-xs">/{maxField}</span>
    </span>
  );
}

export function AttacksSection({ actor, groups, canEdit }: Props) {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const attacks = groups.flatMap((group) => group.attacks);

  const showMenu = (item: MonsterItem, anchor: Anchor, fromButton = false) => {
    const base = {
      ...itemMenu(item, canEdit, anchor),
      placement: fromButton ? ("bottom-end" as const) : undefined,
    };
    setMenuFor(fromButton ? item.id : null);
    setMenu(
      canEdit
        ? {
            ...base,
            entries: [
              base.entries[0],
              {
                label: "Attack group",
                icon: "fa-solid fa-link",
                entries: patternEntries(item),
              },
              ...base.entries.slice(1),
            ],
          }
        : base,
    );
  };

  const openMenu = (item: MonsterItem, event: MouseEvent) => {
    event.preventDefault();
    showMenu(item, { x: event.clientX, y: event.clientY });
  };

  const closeMenu = () => {
    setMenu(null);
    setMenuFor(null);
  };

  const row = (attack: AttackRow) => {
    const weapon = actor.items.get(attack.id);
    return (
      <div
        role="row"
        key={attack.id}
        className={cx(
          "osc-monster-attack-row",
          attack.exhausted && "is-exhausted",
        )}
        onContextMenu={weapon && ((event) => openMenu(weapon, event))}
      >
        <span role="cell" className="u-flex u-items-center">
          <PatternPip
            label="Attack pattern"
            pattern={attack.pattern}
            onCycle={
              canEdit && weapon ? () => void cyclePattern(weapon) : undefined
            }
          />
        </span>
        <span role="cell" className="u-flex u-items-center">
          {canEdit && weapon && (
            <IconButton
              variant="raised"
              size="sm"
              aria-label={`Attack with ${attack.name}`}
              title={`Attack with ${attack.name}`}
              disabled={attack.exhausted}
              onClick={(event) => void rollMonsterItem(weapon, event)}
            >
              <i className="fa-solid fa-dice-d20" aria-hidden="true" />
            </IconButton>
          )}
        </span>
        <span role="cell" className="osc-monster-attack-name">
          <RollLabel
            className="osc-monster-label osc-monster-item-name"
            glyph={false}
            title={canEdit ? "Edit attack" : "View attack"}
            onRoll={
              weapon?.sheet ? () => weapon.sheet?.render(true) : undefined
            }
          >
            {attack.name}
          </RollLabel>
          {attack.save && (
            <Tag size="xs" className="u-ml-1">
              {attack.save}
            </Tag>
          )}
          {attack.slow && (
            <Tag size="xs" className="u-ml-1">
              slow
            </Tag>
          )}
        </span>
        <span role="cell" className="osc-monster-value u-fs-xs">
          {attack.damage ?? EMPTY_VALUE}
          {attack.bonus != null &&
            ` ${attack.bonus > 0 ? "+" : ""}${attack.bonus}`}
        </span>
        <span role="cell" className="u-flex u-justify-end">
          <Uses
            name={attack.name}
            uses={attack.uses}
            onSet={
              canEdit && weapon
                ? (value) => void setUses(weapon, value)
                : undefined
            }
            onSetMax={
              canEdit && weapon
                ? (max) => void setAttacksPerRound(weapon, max)
                : undefined
            }
          />
        </span>
        {canEdit && (
          <span role="cell" className="u-flex u-items-center">
            {weapon && (
              <IconButton
                size="sm"
                aria-label={`More actions for ${attack.name}`}
                aria-haspopup="menu"
                aria-expanded={menuFor === weapon.id}
                onClick={(event) =>
                  showMenu(
                    weapon,
                    event.currentTarget.getBoundingClientRect(),
                    true,
                  )
                }
              >
                <i
                  className="fa-solid fa-ellipsis-vertical"
                  aria-hidden="true"
                />
              </IconButton>
            )}
          </span>
        )}
      </div>
    );
  };

  return (
    <section aria-label="Attacks">
      <SectionTitle variant="hairline">
        <span className="u-flex-1">Attacks</span>
        {canEdit && (
          <span className="u-row u-gap-2">
            {attacks.some((attack) => attack.uses) && (
              <RollLabel
                className="osc-monster-label"
                glyph={false}
                onRoll={() => void resetAttacks(actor)}
              >
                <i className="fa-solid fa-rotate-left" aria-hidden="true" />
                New round
              </RollLabel>
            )}
            <IconButton
              size="sm"
              aria-label="Add attack"
              title="Add attack"
              onClick={() =>
                void createOwnedItem(actor as unknown as OSEActor, "weapon")
              }
            >
              <i className="fa-solid fa-plus" aria-hidden="true" />
            </IconButton>
          </span>
        )}
      </SectionTitle>
      {attacks.length === 0 ? (
        <p className="u-m-0 u-fs-sm u-text-dim">No attacks.</p>
      ) : (
        <div
          role="table"
          aria-label="Attacks"
          className={cx("osc-monster-attack-table", canEdit && "has-actions")}
        >
          <div role="row" className="osc-monster-attack-row osc-monster-label">
            <span role="columnheader" />
            <span role="columnheader" />
            <span role="columnheader">Attack</span>
            <span role="columnheader">Damage</span>
            <span role="columnheader" className="tw:text-right">
              Uses
            </span>
            {canEdit && <span role="columnheader" />}
          </div>
          {attacks.map(row)}
        </div>
      )}
      {menu && <ContextMenu {...menu} onClose={closeMenu} />}
    </section>
  );
}
