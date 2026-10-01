import { useState, type MouseEvent } from "react";
import { createOwnedItem } from "@domain/createOwnedItem";
import type { OSEActor } from "@domain/types";
import { IconButton } from "@ui/IconButton";
import { SectionTitle } from "@ui/SectionTitle";
import { Tag } from "@ui/Tag";
import { cx } from "@ui/cx";
import {
  cyclePattern,
  resetAttacks,
  rollMonsterItem,
  setPattern,
  setUses,
} from "./actions";
import { itemMenu } from "./parts/itemMenu";
import {
  PopupMenu,
  type PopupMenuEntry,
  type PopupMenuState,
} from "./parts/PopupMenu";
import { RollLabel } from "./parts/RollLabel";
import { UsesTally } from "./parts/UsesTally";
import type { MonsterActor, MonsterItem } from "./types";
import { EMPTY_VALUE, type AttackGroup, type AttackRow } from "./viewModel";

type Props = {
  actor: MonsterActor;
  groups: AttackGroup[];
  canEdit: boolean;
};

function patternEntries(item: MonsterItem): PopupMenuEntry[] {
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

function PatternDot({
  pattern,
  onCycle,
}: {
  pattern: string;
  onCycle?: () => void;
}) {
  if (!onCycle) {
    return (
      <span
        className="osc-monster-pattern-dot"
        data-pattern={pattern}
        title={`${pattern} pattern`}
      />
    );
  }
  return (
    <button
      type="button"
      className="osc-monster-pattern-dot"
      data-pattern={pattern}
      aria-label={`Attack pattern: ${pattern}. Click to change`}
      title={`${pattern} pattern`}
      onClick={onCycle}
    />
  );
}

export function AttacksSection({ actor, groups, canEdit }: Props) {
  const [menu, setMenu] = useState<PopupMenuState | null>(null);
  const attacks = groups.flatMap((group) => group.attacks);

  const openMenu = (item: MonsterItem, event: MouseEvent) => {
    event.preventDefault();
    const base = itemMenu(item, canEdit, event);
    setMenu(
      canEdit
        ? {
            ...base,
            entries: [
              base.entries[0],
              {
                label: "Attack group",
                icon: "fa-link",
                entries: patternEntries(item),
              },
              ...base.entries.slice(1),
            ],
          }
        : base,
    );
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
          <PatternDot
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
            className="osc-monster-item-name"
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
          {attack.uses && (
            <UsesTally
              name={attack.name}
              value={attack.uses.value}
              max={attack.uses.max}
              onSet={
                canEdit && weapon
                  ? (value) => void setUses(weapon, value)
                  : undefined
              }
            />
          )}
        </span>
      </div>
    );
  };

  return (
    <section aria-label="Attacks">
      <SectionTitle className="osc-monster-section-title">
        <span className="u-flex-1">Attacks</span>
        {canEdit && (
          <span className="u-row u-gap-2">
            {attacks.some((attack) => attack.uses) && (
              <button
                type="button"
                className="osc-monster-label osc-monster-roll"
                onClick={() => void resetAttacks(actor)}
              >
                <i className="fa-solid fa-rotate-left" aria-hidden="true" />
                New round
              </button>
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
          className="osc-monster-attack-table"
        >
          <div role="row" className="osc-monster-attack-row osc-monster-label">
            <span role="columnheader" />
            <span role="columnheader" />
            <span role="columnheader">Attack</span>
            <span role="columnheader">Damage</span>
            <span role="columnheader" className="tw:text-right">
              Uses
            </span>
          </div>
          {attacks.map(row)}
        </div>
      )}
      {menu && <PopupMenu menu={menu} onClose={() => setMenu(null)} />}
    </section>
  );
}
