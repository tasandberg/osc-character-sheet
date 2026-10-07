import { useState, type MouseEvent, type ReactNode } from "react";
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

function RollRow({
  label,
  prefix,
  onRoll,
  children,
}: {
  label: string;
  prefix?: ReactNode;
  onRoll?: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}) {
  return (
    <LeaderRow
      label={
        <>
          {prefix}
          <span className="vm-key">{label}</span>
        </>
      }
    >
      {children}
      {onRoll && (
        <button
          type="button"
          className="osc-monster-roll-die"
          aria-label={`Roll ${label}`}
          title={`Roll ${label}`}
          onClick={onRoll}
        >
          <i
            className="fa-solid fa-dice-d20 roll-label-die"
            aria-hidden="true"
          />
        </button>
      )}
    </LeaderRow>
  );
}

export function StatFrame({ actor, view, commit, onGenerateSaves }: Props) {
  const [movementAnchor, setMovementAnchor] = useState<DOMRect | null>(null);
  const canEdit = !!commit;
  const { appearing, movement } = view;

  return (
    <RuleFrame
      as="section"
      aria-label="Statistics"
      className="osc-monster-stats"
      inset="u-px-3 u-py-2"
    >
      <div className="osc-monster-stat-grid u-grid-2 tw:gap-x-5">
        <div className="osc-monster-stat-column">
          <LeaderRow
            label={<span className="vm-key">{view.armourClass.label}</span>}
          >
            <InlineEditValue
              label={view.armourClass.label}
              value={view.armourClass.value}
              placeholder="—"
              onCommit={commit?.number(view.armourClass.path)}
            />
          </LeaderRow>
          <RollRow
            label="Hit Dice"
            onRoll={
              view.hitDice.rollable
                ? (event) => actor.rollHitDice({ event })
                : undefined
            }
          >
            <InlineEditValue
              label="Hit Dice"
              value={view.hitDice.value}
              placeholder="—"
              onCommit={commit?.text("system.hp.hd")}
            />
          </RollRow>
          <RollRow
            label={view.attack.label}
            onRoll={(event) => rollBareAttack(actor, event)}
          >
            <InlineEditValue
              label={view.attack.label}
              value={view.attack.value}
              editValue={view.attack.editValue}
              placeholder="—"
              onCommit={commit?.number(view.attack.path)}
            />
          </RollRow>
          <RollRow
            label="Appearing"
            onRoll={
              appearing.rollableDungeon
                ? (event) => actor.rollAppearing({ event, check: "dungeon" })
                : undefined
            }
          >
            <InlineEditValue
              label="Number appearing in a dungeon"
              value={appearing.dungeon}
              placeholder="—"
              onCommit={commit?.loose("system.details.appearing.d")}
            />
          </RollRow>
          <RollRow
            prefix={
              <span aria-hidden="true" className="vm-key">
                ↳
              </span>
            }
            label="Lair"
            onRoll={
              appearing.rollableLair
                ? (event) => actor.rollAppearing({ event, check: "wilderness" })
                : undefined
            }
          >
            <InlineEditValue
              label="Number appearing in a lair"
              value={appearing.lair}
              placeholder="—"
              onCommit={commit?.loose("system.details.appearing.w")}
            />
          </RollRow>
        </div>
        <div className="osc-monster-stat-column">
          <RollRow
            label="Reaction"
            onRoll={(event) => actor.rollReaction({ event })}
          >
            2d6
          </RollRow>
          {view.morale && (
            <RollRow
              label="Morale"
              onRoll={
                view.morale.rollable
                  ? (event) => actor.rollMorale({ event })
                  : undefined
              }
            >
              <InlineEditValue
                label="Morale"
                value={view.morale.value}
                placeholder="—"
                onCommit={commit?.loose("system.details.morale")}
              />
            </RollRow>
          )}
          {view.loyalty != null && (
            <RollRow
              label="Loyalty"
              onRoll={(event) => actor.rollLoyalty({ event })}
            >
              <InlineEditValue
                label="Loyalty"
                value={view.loyalty}
                placeholder="—"
                onCommit={commit?.number("system.retainer.loyalty")}
              />
            </RollRow>
          )}
          <LeaderRow label={<span className="vm-key">Treasure</span>}>
            <TreasureValue
              treasure={view.treasure}
              onClear={canEdit ? () => void clearTreasure(actor) : undefined}
            />
          </LeaderRow>
        </div>
      </div>
      <div className="u-mt-3">
        <LeaderRow label={<span className="vm-key">Movement</span>}>
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
              {movement.footnote && (
                <span className="u-text-dim"> · {movement.footnote}</span>
              )}
            </button>
          ) : (
            <span>
              {movement.display}
              {movement.footnote && (
                <span className="u-text-dim"> · {movement.footnote}</span>
              )}
            </span>
          )}
        </LeaderRow>
      </div>
      <DividedRow className="u-items-center u-mt-3 u-pt-3 u-pb-1 tw:border-t tw:border-(--hairline)">
        {view.saves.map((save) => (
          <div
            key={save.key}
            className="u-flex u-items-center u-justify-center tw:gap-[calc(var(--spacer-1)*1.5)]"
          >
            <RollLabel
              className="vm-key osc-monster-save-label"
              glyph={false}
              title={`Roll save versus ${save.label.toLowerCase()}`}
              onRoll={(event) => actor.rollSave(save.key, { event })}
            >
              {save.label}
            </RollLabel>
            <InlineEditValue
              label={`Save versus ${save.label}`}
              className="osc-monster-save-value"
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
