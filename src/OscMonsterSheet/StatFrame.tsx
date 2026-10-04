import { useState } from "react";
import { Button } from "@ui/Button";
import { DividedRow } from "@ui/DividedRow";
import { LeaderRow } from "@ui/LeaderRow";
import { RuleFrame } from "@ui/RuleFrame";
import { InlineEditValue } from "@ui/InlineEditValue";
import { MovementPopover } from "./parts/MovementPopover";
import { RollLabel } from "@ui/RollLabel";
import { TreasureValue } from "./parts/TreasureValue";
import { clearTreasure, rollBareAttack } from "./actions";
import type { Commit } from "./commit";
import type { MonsterActor } from "./types";
import type { MonsterView } from "./viewModel";

type Props = {
  actor: MonsterActor;
  view: MonsterView;
  commit?: Commit;
  onGenerateSaves?: () => void;
};

export function StatFrame({ actor, view, commit, onGenerateSaves }: Props) {
  const [movementAnchor, setMovementAnchor] = useState<DOMRect | null>(null);
  const canEdit = !!commit;
  const { appearing, movement } = view;

  return (
    <RuleFrame as="section" aria-label="Statistics" inset="u-px-3 u-py-2">
      <div className="osc-monster-stat-grid u-grid-2 tw:gap-x-5">
        <div className="osc-monster-stat-column u-gap-1">
          <LeaderRow
            valueClassName="u-fs-xs"
            label={
              <span className="osc-monster-label">
                {view.armourClass.label}
              </span>
            }
          >
            <InlineEditValue
              label={view.armourClass.label}
              value={view.armourClass.value}
              placeholder="—"
              onCommit={commit?.number(view.armourClass.path)}
            />
          </LeaderRow>
          <LeaderRow
            valueClassName="u-fs-xs"
            label={
              <RollLabel
                className="osc-monster-label"
                onRoll={
                  view.hitDice.rollable
                    ? (event) => actor.rollHitDice({ event })
                    : undefined
                }
              >
                Hit Dice
              </RollLabel>
            }
          >
            <InlineEditValue
              label="Hit Dice"
              value={view.hitDice.value}
              placeholder="—"
              onCommit={commit?.text("system.hp.hd")}
            />
          </LeaderRow>
          <LeaderRow
            valueClassName="u-fs-xs"
            label={
              <RollLabel
                className="osc-monster-label"
                onRoll={(event) => rollBareAttack(actor, event)}
              >
                {view.attack.label}
              </RollLabel>
            }
          >
            <InlineEditValue
              label={view.attack.label}
              value={view.attack.value}
              placeholder="—"
              onCommit={commit?.number(view.attack.path)}
            />
          </LeaderRow>
          <LeaderRow
            valueClassName="u-fs-xs"
            label={<span className="osc-monster-label">Treasure</span>}
          >
            <TreasureValue
              treasure={view.treasure}
              onClear={canEdit ? () => void clearTreasure(actor) : undefined}
            />
          </LeaderRow>
          <LeaderRow
            valueClassName="u-fs-xs"
            label={
              <RollLabel
                className="osc-monster-label"
                onRoll={(event) => actor.rollReaction({ event })}
              >
                Reaction
              </RollLabel>
            }
          >
            2d6
          </LeaderRow>
          {view.loyalty != null && (
            <LeaderRow
              valueClassName="u-fs-xs"
              label={
                <RollLabel
                  className="osc-monster-label"
                  onRoll={(event) => actor.rollLoyalty({ event })}
                >
                  Loyalty
                </RollLabel>
              }
            >
              <InlineEditValue
                label="Loyalty"
                value={view.loyalty}
                placeholder="—"
                onCommit={commit?.number("system.retainer.loyalty")}
              />
            </LeaderRow>
          )}
        </div>
        <div className="osc-monster-stat-column u-gap-1">
          <LeaderRow
            valueClassName="u-fs-xs"
            label={<span className="osc-monster-label">Movement</span>}
          >
            {commit ? (
              <button
                type="button"
                className="inline-edit"
                aria-label="Edit movement"
                aria-expanded={!!movementAnchor}
                onClick={(event) =>
                  setMovementAnchor(event.currentTarget.getBoundingClientRect())
                }
              >
                {movement.display}
                {movement.footnote && "*"}
              </button>
            ) : (
              <span>
                {movement.display}
                {movement.footnote && "*"}
              </span>
            )}
          </LeaderRow>
          {view.morale && (
            <LeaderRow
              valueClassName="u-fs-xs"
              label={
                <RollLabel
                  className="osc-monster-label"
                  onRoll={
                    view.morale.rollable
                      ? (event) => actor.rollMorale({ event })
                      : undefined
                  }
                >
                  Morale
                </RollLabel>
              }
            >
              <InlineEditValue
                label="Morale"
                value={view.morale.value}
                placeholder="—"
                onCommit={commit?.loose("system.details.morale")}
              />
            </LeaderRow>
          )}
          <LeaderRow
            valueClassName="u-fs-xs"
            label={
              <RollLabel
                className="osc-monster-label"
                onRoll={
                  appearing.rollableDungeon
                    ? (event) =>
                        actor.rollAppearing({ event, check: "dungeon" })
                    : undefined
                }
              >
                Appearing
              </RollLabel>
            }
          >
            <InlineEditValue
              label="Number appearing in a dungeon"
              value={appearing.dungeon}
              placeholder="—"
              onCommit={commit?.loose("system.details.appearing.d")}
            />
          </LeaderRow>
          <LeaderRow
            valueClassName="u-fs-xs"
            label={
              <>
                <span
                  aria-hidden="true"
                  className="osc-monster-label u-text-dim"
                >
                  ↳
                </span>
                <RollLabel
                  className="osc-monster-label"
                  onRoll={
                    appearing.rollableLair
                      ? (event) =>
                          actor.rollAppearing({ event, check: "wilderness" })
                      : undefined
                  }
                >
                  Lair
                </RollLabel>
              </>
            }
          >
            <InlineEditValue
              label="Number appearing in a lair"
              value={appearing.lair}
              placeholder="—"
              onCommit={commit?.loose("system.details.appearing.w")}
            />
          </LeaderRow>
        </div>
      </div>
      {movement.footnote && (
        <p className="osc-monster-footnote u-m-0 u-mt-1 u-fs-sm u-text-dim">
          * {movement.footnote}
        </p>
      )}
      <DividedRow className="u-items-baseline u-mt-2 u-pt-2 tw:border-t tw:border-(--hairline)">
        {view.saves.map((save) => (
          <div
            key={save.key}
            className="u-flex u-items-baseline u-justify-center tw:gap-[calc(var(--spacer-1)*1.5)]"
          >
            <RollLabel
              className="osc-monster-label osc-monster-save-label"
              glyph={false}
              title={`Roll save versus ${save.label.toLowerCase()}`}
              onRoll={(event) => actor.rollSave(save.key, { event })}
            >
              {save.label}
            </RollLabel>
            <InlineEditValue
              label={`Save versus ${save.label}`}
              className="osc-monster-save-value u-fs-xl"
              value={save.value}
              placeholder="—"
              onCommit={commit?.number(`system.saves.${save.key}.value`)}
            />
          </div>
        ))}
      </DividedRow>
      {view.needsSaves && onGenerateSaves && (
        <div className="u-flex u-justify-center u-mt-2">
          <Button
            variant="outline"
            tone="brass"
            size="sm"
            onClick={onGenerateSaves}
          >
            Generate saves from Hit Dice
          </Button>
        </div>
      )}
      {movementAnchor && commit && (
        <MovementPopover
          anchor={movementAnchor}
          base={movement.base}
          details={movement.details}
          onCommit={commit.patch}
          onClose={() => setMovementAnchor(null)}
        />
      )}
    </RuleFrame>
  );
}
