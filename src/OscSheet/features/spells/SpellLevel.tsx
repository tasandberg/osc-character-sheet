import { useState } from "react";
import { useOscSheetContext } from "@app/context";
import type { OseSpell } from "@domain/types";
import type { SpellLevelVM } from "@domain/vm-types";
import { spellMeta } from "@features/spells/spells";
import { SpellCastRow } from "@features/spells/SpellCastRow";
import { cx } from "@ui/cx";
import { Pips } from "@ui/Pips";

/**
 * One spell level: ink-stamp "Level N" badge + "used / max ready" + slot pips,
 * the prepared-spell cast rows, and an expandable spellbook of all known spells.
 */
export default function SpellLevel({ vm }: { vm: SpellLevelVM }) {
  const { canEdit } = useOscSheetContext();
  const { level, slots, occupied, prepared, spellbook } = vm;
  const [bookOpen, setBookOpen] = useState(false);

  // Capacity is measured in OCCUPIED slots (sum of memorized), which persists across
  // casts — so you can't over-memorise even after spells are spent.
  const atCapacity = occupied >= slots.max;

  // Memorise into a slot: bump both memorized (the selection) and cast (a ready cast).
  const prepare = (spell: OseSpell) => {
    if (atCapacity) return;
    void spell.update({
      "system.memorized": spell.system.memorized + 1,
      "system.cast": spell.system.cast + 1,
    });
  };
  // Free a slot — works even when spent (cast 0): drop one memorized + one cast.
  const unprepare = (spell: OseSpell) => {
    if (spell.system.memorized <= 0) return;
    void spell.update({
      "system.memorized": spell.system.memorized - 1,
      "system.cast": Math.max(0, spell.system.cast - 1),
    });
  };
  const cast = (spell: OseSpell) => spell.spendSpell({ skipDialog: false });

  return (
    <div className="osc-spelllevel">
      <div className="osc-spellhead">
        <span className="lv">Level {level}</span>
        <span className="sc">
          {slots.used} / {slots.max} ready
        </span>
        <Pips
          total={slots.max}
          filled={slots.used}
          hollow
          className="slots"
          aria-hidden="true"
          glyph={<i className="fa-solid fa-diamond" />}
        />
      </div>

      {prepared.length === 0 ? (
        <div className="osc-spell empty">
          <div className="none">None memorised — open the spellbook.</div>
        </div>
      ) : (
        prepared.map((spell) => (
          <SpellCastRow
            key={spell._id as string}
            spell={spell}
            rowClass="osc-spell"
            meta={spellMeta(spell).map((p) => (
              <span key={p.kind} className={cx(p.kind === "damage" && "dmg")}>
                {p.text}
              </span>
            ))}
            canCast={canEdit}
            onCast={() => cast(spell)}
            onUnprepare={canEdit ? () => unprepare(spell) : undefined}
            onOpenName={() => spell.sheet.render(true)}
          />
        ))
      )}

      <button
        type="button"
        className={cx("osc-bookbtn", bookOpen && "open")}
        onClick={() => setBookOpen((o) => !o)}
        aria-expanded={bookOpen}
      >
        <i className={cx("fa-solid", bookOpen ? "fa-caret-down" : "fa-caret-right")} aria-hidden="true" />
        Spellbook ({spellbook.length})
      </button>
      {bookOpen && (
        <div className="osc-book">
          {spellbook.length === 0 ? (
            <div className="osc-book-empty">No spells known at this level.</div>
          ) : (
            spellbook.map((spell) => {
              // Read-only: list known spells as static rows (no memorise action).
              if (!canEdit) {
                return (
                  <span key={spell._id as string} className="osc-bookspell is-static">
                    <span className="bn">{spell.name}</span>
                  </span>
                );
              }
              // Spellbook always MEMORISES (adds a copy) up to the level's free
              // slots — always a "+", never a checkmark, and no "prepared"
              // highlight (adding one is reflected in the prepared rows above).
              return (
                <button
                  type="button"
                  key={spell._id as string}
                  className="osc-bookspell"
                  disabled={atCapacity}
                  onClick={() => prepare(spell)}
                  title={atCapacity ? "No slots left at this level" : `Memorise ${spell.name}`}
                >
                  <span className="bn">{spell.name}</span>
                  <span className="pa" aria-hidden="true">
                    <i className="fa-solid fa-plus" />
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
