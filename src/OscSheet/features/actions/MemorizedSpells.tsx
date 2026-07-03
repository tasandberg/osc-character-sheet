import type { OSEActor, OseSpell } from "@domain/types";
import { SectionTitle } from "@ui/SectionTitle";
import { SpellCastRow } from "@features/spells/SpellCastRow";
import { spellMeta } from "@features/spells/spells";
import { cx } from "@ui/cx";

type Props = { actor: OSEActor };

/**
 * Quick-cast list of selected spells — the same rich <SpellCastRow> the Spells
 * tab uses (range · duration · save meta, clickable name), minus the trashcan
 * (no `onUnprepare`, since you don't un-memorise from the Actions tab).
 * Gated on `cast > 0 || memorized > 0` so it catches every selected spell incl.
 * fully-spent ones (memorized persists). Cast → `spendSpell`.
 */
export function MemorizedSpells({ actor }: Props) {
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
            meta={spellMeta(spell).map((p) => (
              <span key={p.kind} className={cx(p.kind === "damage" && "dmg")}>
                {p.text}
              </span>
            ))}
            onCast={() => spell.spendSpell({ skipDialog: false })}
            onOpenName={() => spell.sheet.render(true)}
          />
        ))}
      </div>
    </section>
  );
}
