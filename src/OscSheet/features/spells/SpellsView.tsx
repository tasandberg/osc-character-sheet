import { useState } from "react";
import { useOscSheetContext } from "@app/context";
import { SectionTitle } from "@ui/SectionTitle";
import { PillSelect } from "@ui/PillSelect";
import { selectSpellLevels, resetSpellPoints } from "@features/spells/spells";
import { cx } from "@ui/cx";
import SpellLevel from "@features/spells/SpellLevel";

/**
 * Spells tab. Default (memorization enabled): a per-level panel stack with slot
 * pips, prepared cast rows, and each level's expandable spellbook; Rest
 * re-memorises every spell. Free-casting (memorization disabled): a level-pill
 * selector over one per-level panel that lists every known spell as castable
 * against a shared point pool; Study refills every level's pool.
 */
export default function Spells() {
  const { actor, canEdit } = useOscSheetContext();
  const levels = selectSpellLevels(actor);
  const freeCasting = levels.some((l) => l.freeCasting);
  const [busy, setBusy] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const refresh = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (freeCasting) {
        await resetSpellPoints(actor);
      } else {
        const updates: Promise<unknown>[] = [];
        for (const { spellbook } of levels) {
          for (const spell of spellbook) {
            if (spell.system.cast !== spell.system.memorized) {
              updates.push(spell.update({ "system.cast": spell.system.memorized }));
            }
          }
        }
        await Promise.all(updates);
      }
    } finally {
      setBusy(false);
    }
  };

  const active = freeCasting
    ? levels.find((l) => l.level === selectedLevel) ?? levels[0]
    : undefined;

  return (
    <section className="osc-section osc-spells">
      <SectionTitle className="osc-spells-title">
        Spells
        <span className="hint">{freeCasting ? "known · slot pool" : "memorised slots"}</span>
        {canEdit && (
          <button
            type="button"
            className="osc-rest"
            onClick={refresh}
            disabled={busy}
            aria-busy={busy}
            title={freeCasting ? "Refresh all spell-point pools" : "Re-memorise all spells"}
          >
            <i
              className={cx(
                "fa-solid",
                busy ? "fa-spinner fa-spin" : freeCasting ? "fa-arrow-rotate-left" : "fa-campground",
              )}
              aria-hidden="true"
            />{" "}
            {freeCasting ? "Study" : "Rest"}
          </button>
        )}
      </SectionTitle>

      {freeCasting ? (
        <>
          <PillSelect<number>
            ariaLabel="Spell level"
            className="osc-spelltabs"
            value={active?.level ?? 0}
            onValueChange={setSelectedLevel}
            options={levels.map((l) => ({ value: l.level, label: `Lv ${l.level}`, count: l.points.max }))}
          />
          {active && <SpellLevel key={active.level} vm={active} />}
        </>
      ) : (
        levels.map((vm) => <SpellLevel key={vm.level} vm={vm} />)
      )}
    </section>
  );
}
