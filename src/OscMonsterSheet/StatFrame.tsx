import { useState, type MouseEvent } from "react";
import { Button } from "@ui/Button";
import type { RollEvent } from "@domain/types";
import { InlineEdit } from "./parts/InlineEdit";
import { LeaderRow } from "./parts/LeaderRow";
import { PopupMenu, type PopupMenuState } from "./parts/PopupMenu";
import { RollLabel } from "./parts/RollLabel";
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
  const [menu, setMenu] = useState<PopupMenuState | null>(null);
  const canEdit = !!commit;
  const { appearing, movement } = view;

  const rollAppearing = (event: MouseEvent<HTMLElement>) => {
    const roll = (check: "dungeon" | "wilderness", source: RollEvent) =>
      actor.rollAppearing({ event: source, check });
    if (appearing.rollableDungeon && appearing.rollableLair) {
      const rect = event.currentTarget.getBoundingClientRect();
      const source = { ctrlKey: event.ctrlKey, metaKey: event.metaKey };
      setMenu({
        x: rect.left,
        y: rect.bottom,
        title: "Roll number appearing",
        entries: [
          {
            label: `Dungeon · ${appearing.dungeon}`,
            onSelect: () => roll("dungeon", source),
          },
          {
            label: `Lair · ${appearing.lair}`,
            onSelect: () => roll("wilderness", source),
          },
        ],
      });
      return;
    }
    roll(appearing.rollableDungeon ? "dungeon" : "wilderness", event);
  };

  return (
    <section className="osc-monster-frame" aria-label="Statistics">
      <div className="osc-monster-frame-inner u-px-3 u-py-2">
        <div className="osc-monster-stat-grid u-grid-2 tw:gap-x-5">
          <div className="osc-monster-stat-column">
            <LeaderRow
              label={
                <span className="osc-monster-label">
                  {view.armourClass.label}
                </span>
              }
            >
              <InlineEdit
                label={view.armourClass.label}
                value={view.armourClass.value}
                onCommit={commit?.number(view.armourClass.path)}
              >
                {view.armourClass.display}
              </InlineEdit>
            </LeaderRow>
            <LeaderRow
              label={
                <RollLabel
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
              <InlineEdit
                label="Hit Dice"
                value={view.hitDice.value}
                onCommit={commit?.text("system.hp.hd")}
              >
                {view.hitDice.display}
              </InlineEdit>
            </LeaderRow>
            <LeaderRow
              label={
                <RollLabel onRoll={(event) => rollBareAttack(actor, event)}>
                  {view.attack.label}
                </RollLabel>
              }
            >
              <InlineEdit
                label={view.attack.label}
                value={view.attack.value}
                onCommit={commit?.number(view.attack.path)}
              >
                {view.attack.display}
              </InlineEdit>
            </LeaderRow>
            <LeaderRow
              label={<span className="osc-monster-label">Treasure</span>}
            >
              <TreasureValue
                treasure={view.treasure}
                onClear={canEdit ? () => void clearTreasure(actor) : undefined}
              />
            </LeaderRow>
            {view.loyalty != null && (
              <LeaderRow
                label={
                  <RollLabel onRoll={(event) => actor.rollLoyalty({ event })}>
                    Loyalty
                  </RollLabel>
                }
              >
                <InlineEdit
                  label="Loyalty"
                  value={view.loyalty}
                  onCommit={commit?.number("system.retainer.loyalty")}
                />
              </LeaderRow>
            )}
          </div>
          <div className="osc-monster-stat-column">
            <LeaderRow
              label={<span className="osc-monster-label">Movement</span>}
            >
              <InlineEdit
                label="Base movement"
                value={movement.base}
                onCommit={commit?.number("system.movement.base")}
              >
                {movement.display}
                {movement.footnote && "*"}
              </InlineEdit>
            </LeaderRow>
            {view.morale && (
              <LeaderRow
                label={
                  <RollLabel
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
                <InlineEdit
                  label="Morale"
                  value={view.morale.value}
                  placeholder="—"
                  onCommit={commit?.loose("system.details.morale")}
                />
              </LeaderRow>
            )}
            <LeaderRow
              label={
                <RollLabel
                  onRoll={
                    appearing.rollableDungeon || appearing.rollableLair
                      ? rollAppearing
                      : undefined
                  }
                >
                  Appearing
                </RollLabel>
              }
            >
              <InlineEdit
                label="Number appearing in a dungeon"
                value={appearing.dungeon}
                placeholder="—"
                onCommit={commit?.loose("system.details.appearing.d")}
              />{" "}
              (
              <InlineEdit
                label="Number appearing in a lair"
                value={appearing.lair}
                placeholder="—"
                onCommit={commit?.loose("system.details.appearing.w")}
              />
              )
            </LeaderRow>
            <LeaderRow
              label={
                <RollLabel onRoll={(event) => actor.rollReaction({ event })}>
                  Reaction
                </RollLabel>
              }
            >
              2d6
            </LeaderRow>
          </div>
        </div>
        {movement.footnote && (
          <p className="osc-monster-footnote u-m-0 u-mt-1 u-fs-sm u-text-dim">
            *{" "}
            <InlineEdit
              label="Movement details"
              value={movement.footnote}
              onCommit={commit?.text("system.details.movement")}
            />
          </p>
        )}
        <div className="osc-monster-saves u-grid u-mt-1 u-pt-1">
          {view.saves.map((save) => (
            <RollLabel
              key={save.key}
              onRoll={(event) => actor.rollSave(save.key, { event })}
            >
              {save.label}
            </RollLabel>
          ))}
          {view.saves.map((save) => (
            <span key={save.key} className="osc-monster-value u-fs-xs">
              <InlineEdit
                label={`Save versus ${save.label}`}
                value={save.value}
                placeholder="—"
                onCommit={commit?.number(`system.saves.${save.key}.value`)}
              />
            </span>
          ))}
        </div>
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
      </div>
      {menu && <PopupMenu menu={menu} onClose={() => setMenu(null)} />}
    </section>
  );
}
