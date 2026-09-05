import type { OSEActor, OseSpell } from "@domain/types";
import { useOscSheetContext } from "@app/context";
import { SectionTitle } from "@ui/SectionTitle";
import { SpellRow } from "@features/spells/SpellRow";
import {
  spellMeta,
  selectFavoriteSpells,
  castFree,
  pointsLeftAt,
  slotMaxAt,
  setCasts,
  pipMessage,
} from "@features/spells/spells";
import { useToast } from "@ui/toastContext";
import { cx } from "@ui/cx";
import { useSetting } from "@src/OscSheet/settings";

type Props = { actor: OSEActor };

/**
 * Quick-cast list on the Actions tab. With memorization ENABLED (default) it
 * lists the selected/memorized spells (a <SpellRow> with the level badge).
 * With memorization DISABLED it lists FAVORITED spells instead, cast against
 * each level's shared spell-point budget.
 */
export function MemorizedSpells({ actor }: Props) {
  const { canEdit, items, optimisticUpdate } = useOscSheetContext();
  const toast = useToast();
  const freeCasting = useSetting("disableMemorization");
  const meta = (spell: OseSpell) =>
    spellMeta(spell).map((p) => (
      <span key={p.kind} className={cx(p.kind === "roll" && "dmg")}>
        {p.text}
      </span>
    ));

  if (freeCasting) {
    const favorites = selectFavoriteSpells(actor);
    if (favorites.length === 0) return null;
    return (
      <section className="osc-section">
        <SectionTitle hint="favorites — click to cast">Spells</SectionTitle>
        <div className="fvtt-castlist tw:mt-[2px] tw:flex tw:flex-col">
          {favorites.map((spell) => {
            const lvl = spell.system.lvl;
            const max = slotMaxAt(actor, lvl);
            const left = pointsLeftAt(actor, lvl, max);
            return (
              <SpellRow
                key={spell._id as string}
                spell={spell}
                meta={meta(spell)}
                free
                levelTag={lvl}
                pool={{ used: max - left, max }}
                spent={left <= 0}
                spentTitle="No spell points left at this level (Study to recover)"
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

  // Same flatten + path as the Spells tab: spellList is Record<level, OseSpell[]>,
  // resolved through the context items so optimistic overlays show.
  const byId = new Map(items.map((it) => [it._id as string, it]));
  const spells: OseSpell[] = Object.values(actor.system.spells?.spellList ?? {})
    .flat()
    .map((s) => (byId.get(s._id as string) as OseSpell | undefined) ?? s)
    .filter((s) => (s.system.cast ?? 0) > 0 || (s.system.memorized ?? 0) > 0)
    .sort((a, b) => a.system.lvl - b.system.lvl);

  if (spells.length === 0) return null;

  return (
    <section className="osc-section">
      <SectionTitle hint="click to cast">Memorized Spells</SectionTitle>
      <div className="fvtt-castlist tw:mt-[2px] tw:flex tw:flex-col">
        {spells.map((spell) => {
          const left = spell.system.cast ?? 0;
          const total = Math.max(spell.system.memorized ?? 0, left);
          return (
            <SpellRow
              key={spell._id as string}
              spell={spell}
              meta={meta(spell)}
              levelTag={spell.system.lvl}
              pips={{
                total,
                filled: left,
                onSet: canEdit
                  ? (n) => {
                      void setCasts(spell, n, optimisticUpdate);
                      const msg = pipMessage(`${spell.name} uses`, left, n, total);
                      if (msg)
                        toast({
                          intent: n > left ? "success" : undefined,
                          title: msg,
                        });
                    }
                  : undefined,
              }}
              spent={left <= 0}
              spentTitle={`${spell.name} — spent (Rest to recover)`}
              canCast={canEdit}
              onCast={() => spell.spendSpell({ skipDialog: false })}
              onOpenName={() => spell.sheet.render(true)}
            />
          );
        })}
      </div>
    </section>
  );
}
