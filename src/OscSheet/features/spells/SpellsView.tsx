import { useState } from "react";
import { useOscSheetContext } from "@app/context";
import { SectionTitle } from "@ui/SectionTitle";
import { selectSpellLevels, resetSpellPoints } from "@features/spells/spells";
import { cx } from "@ui/cx";
import SpellLevel from "@features/spells/SpellLevel";

/**
 * Spells tab: per-level panels (slot pips + prepared cast rows + expandable
 * spellbook). Rest re-memorises every spell (restores `cast` to `memorized`), or
 * in free-casting mode refills every level's spell-point budget.
 */
export default function Spells() {
  const { actor, canEdit } = useOscSheetContext();
  const levels = selectSpellLevels(actor);
  const freeCasting = levels.some((l) => l.freeCasting);
  const [resting, setResting] = useState(false);

  const rest = async () => {
    if (resting) return;
    setResting(true);
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
      setResting(false);
    }
  };

  return (
    <section className="osc-section osc-spells">
      <SectionTitle className="osc-spells-title">
        Spells
        <span className="hint">{freeCasting ? "spell points" : "memorised slots"}</span>
        {canEdit && (
          <button
            type="button"
            className="osc-rest"
            onClick={rest}
            disabled={resting}
            aria-busy={resting}
            title="Re-memorise all spells"
          >
            <i
              className={cx("fa-solid", resting ? "fa-spinner fa-spin" : "fa-campground")}
              aria-hidden="true"
            />{" "}
            Rest
          </button>
        )}
      </SectionTitle>
      {levels.map((vm) => (
        <SpellLevel key={vm.level} vm={vm} />
      ))}
    </section>
  );
}
