import type { OSEActor, OseSpell } from "@domain/types";
import { useOscSheetContext } from "@app/context";
import { SectionTitle } from "@ui/SectionTitle";
import { SpellCastRow } from "@features/spells/SpellCastRow";
import { FreeCastRow } from "@features/spells/FreeCastRow";
import {
  spellMeta,
  memorizationDisabled,
  selectFavoriteSpells,
  castFree,
  pointsLeftAt,
} from "@features/spells/spells";
import { cx } from "@ui/cx";

type Props = { actor: OSEActor };

/**
 * Quick-cast list on the Actions tab. With memorization ENABLED (default) it
 * lists the selected/memorized spells (rich <SpellCastRow> with cast dots).
 * With memorization DISABLED it lists FAVORITED spells instead, cast against
 * each level's shared spell-point budget.
 */
export function MemorizedSpells({ actor }: Props) {
  const { canEdit } = useOscSheetContext();
  const meta = (spell: OseSpell) =>
    spellMeta(spell).map((p) => (
      <span key={p.kind} className={cx(p.kind === "damage" && "dmg")}>
        {p.text}
      </span>
    ));

  if (memorizationDisabled()) {
    const favorites = selectFavoriteSpells(actor);
    if (favorites.length === 0) return null;
    const slots = actor.system.spells?.slots ?? {};
    return (
      <section className="osc-section">
        <SectionTitle hint="favorites — click to cast">Spells</SectionTitle>
        <div className="fvtt-castlist">
          {favorites.map((spell) => {
            const lvl = spell.system.lvl;
            const max = (slots[lvl] ?? { max: 0 }).max;
            const left = pointsLeftAt(actor, lvl, max);
            return (
              <FreeCastRow
                key={spell._id as string}
                spell={spell}
                meta={meta(spell)}
                levelTag={lvl}
                pool={{ used: max - left, max }}
                exhausted={left <= 0}
                canCast={canEdit}
                onCast={() => castFree(actor, spell, max)}
                onOpenName={() => spell.sheet.render(true)}
              />
            );
          })}
        </div>
      </section>
    );
  }

  // Same flatten + path as the Spells tab: spellList is Record<level, OseSpell[]>.
  const spells: OseSpell[] = Object.values(actor.system.spells?.spellList ?? {})
    .flat()
    .filter((s) => (s.system.cast ?? 0) > 0 || (s.system.memorized ?? 0) > 0)
    .sort((a, b) => a.system.lvl - b.system.lvl);

  if (spells.length === 0) return null;

  return (
    <section className="osc-section">
      <SectionTitle hint="click to cast">Memorized Spells</SectionTitle>
      <div className="fvtt-castlist">
        {spells.map((spell) => (
          <SpellCastRow
            key={spell._id as string}
            spell={spell}
            rowClass="osc-spell"
            meta={meta(spell)}
            canCast={canEdit}
            onCast={() => spell.spendSpell({ skipDialog: false })}
            onOpenName={() => spell.sheet.render(true)}
          />
        ))}
      </div>
    </section>
  );
}
