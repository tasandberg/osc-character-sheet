import { useState } from "react";
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
  setUses,
} from "./actions";
import { itemMenu } from "./parts/itemMenu";
import { PopupMenu, type PopupMenuState } from "./parts/PopupMenu";
import { RollLabel } from "./parts/RollLabel";
import { UsesTally } from "./parts/UsesTally";
import type { MonsterActor } from "./types";
import { EMPTY_VALUE, type AttackRow } from "./viewModel";

type Props = { actor: MonsterActor; attacks: AttackRow[]; canEdit: boolean };

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

export function AttacksSection({ actor, attacks, canEdit }: Props) {
  const [menu, setMenu] = useState<PopupMenuState | null>(null);
  const item = (id: string) => actor.items.get(id);

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
        <div role="table" aria-label="Attacks">
          <div role="row" className="osc-monster-attack-row osc-monster-label">
            <span role="columnheader" />
            <span role="columnheader">Attack</span>
            <span role="columnheader">Damage</span>
            <span role="columnheader" className="tw:text-right">
              Uses
            </span>
          </div>
          {attacks.map((attack) => {
            const weapon = item(attack.id);
            return (
              <div
                role="row"
                key={attack.id}
                className={cx(
                  "osc-monster-attack-row",
                  attack.exhausted && "is-exhausted",
                )}
                onContextMenu={
                  weapon &&
                  ((event) => {
                    event.preventDefault();
                    setMenu(itemMenu(weapon, canEdit, event));
                  })
                }
              >
                <span role="cell">
                  <PatternDot
                    pattern={attack.pattern}
                    onCycle={
                      canEdit && weapon
                        ? () => void cyclePattern(weapon)
                        : undefined
                    }
                  />
                </span>
                <span role="cell" className="osc-monster-attack-name">
                  {attack.alternative && (
                    <span className="osc-monster-serif">or </span>
                  )}
                  {attack.count && (
                    <span className="osc-monster-value u-fs-xs">
                      {attack.count}×{" "}
                    </span>
                  )}
                  <RollLabel
                    className="osc-monster-item-name"
                    onRoll={
                      canEdit && weapon
                        ? (event) => void rollMonsterItem(weapon, event)
                        : undefined
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
          })}
        </div>
      )}
      {menu && <PopupMenu menu={menu} onClose={() => setMenu(null)} />}
    </section>
  );
}
