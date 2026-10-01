import { SectionTitle } from "@ui/SectionTitle";
import { rollMonsterItem } from "./actions";
import { RollLabel } from "./parts/RollLabel";
import type { MonsterActor } from "./types";
import type { MonsterView } from "./viewModel";

type Props = {
  actor: MonsterActor;
  levels: MonsterView["spellLevels"];
  canEdit: boolean;
};

export function SpellsSection({ actor, levels, canEdit }: Props) {
  if (!levels.length) return null;
  return (
    <section aria-label="Spells">
      <SectionTitle className="osc-monster-section-title">Spells</SectionTitle>
      <dl className="u-m-0 u-stack u-gap-1">
        {levels.map(({ level, spells }) => (
          <div key={level} className="u-flex u-items-baseline u-gap-2">
            <dt className="osc-monster-label u-flex-none">Level {level}</dt>
            <dd className="u-m-0 u-row u-wrap u-gap-x-3 u-gap-y-1">
              {spells.map((spell) => {
                const item = actor.items.get(spell.id);
                return (
                  <span
                    key={spell.id}
                    className="u-inline-flex u-items-baseline u-gap-1"
                  >
                    <RollLabel
                      className="osc-monster-item-name"
                      onRoll={
                        canEdit && item
                          ? () => void rollMonsterItem(item)
                          : undefined
                      }
                      title="Cast"
                    >
                      {spell.name}
                    </RollLabel>
                    <span
                      className="osc-monster-value u-fs-2xs u-text-dim"
                      title="Cast / memorised"
                    >
                      {spell.cast}/{spell.memorized}
                    </span>
                  </span>
                );
              })}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
