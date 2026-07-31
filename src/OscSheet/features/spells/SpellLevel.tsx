import { useState } from "react";
import { useOscSheetContext } from "@app/context";
import type { OseSpell } from "@domain/types";
import type { SpellLevelVM } from "@domain/vm-types";
import { spellMeta, castFree, isFavorite, toggleFavorite } from "@features/spells/spells";
import { SpellRow } from "@features/spells/SpellRow";
import { SlotMaxDialog } from "@features/spells/SlotMaxDialog";
import { cx } from "@ui/cx";
import { Pips } from "@ui/Pips";

// --- level head: badge · ready count · slot pips ---
const HEAD =
  "osc-spellhead tw:flex tw:items-center tw:gap-2 tw:rounded-t-[7px] tw:border tw:border-border-soft tw:bg-surface-2 tw:px-3 tw:py-[7px]";
/** `--stamp-text` is the light on-ink cream (same as the save stamps) — it reads
 *  on the ink chip in BOTH themes and is lighter than the gold accent. */
const HEAD_LV =
  "lv tw:rounded-sm tw:bg-ink tw:px-2 tw:pt-[3px] tw:pb-[2px] tw:font-display tw:text-[length:var(--fs-xs)] tw:tracking-[0.06em] tw:text-stamp-text";
const HEAD_SC = "sc tw:font-mono tw:text-[length:var(--fs-xs)] tw:text-text-mute";

/** Spellbook entry — a dashed card, clickable (button) when the sheet is
 *  editable and static (span) when it isn't. */
const BOOKSPELL =
  "osc-bookspell tw:flex tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-[5px] tw:border tw:border-dashed tw:border-border-soft tw:bg-surface tw:px-2 tw:py-[5px] tw:text-left tw:font-serif tw:text-[length:var(--fs-sm)] tw:text-text-dim tw:transition-[background,border-color,color] tw:duration-[120ms] tw:hover:not-disabled:border-solid tw:hover:not-disabled:border-gold-dim tw:disabled:cursor-not-allowed tw:disabled:opacity-40";

/**
 * One spell level: ink-stamp "Level N" badge + "used / max" + slot pips,
 * the prepared-spell cast rows, and an expandable spellbook of all known spells.
 * Free-casting mode (memorization disabled) lists every known spell as castable
 * while the level's point budget lasts, with a favorite star.
 */
export default function SpellLevel({ vm }: { vm: SpellLevelVM }) {
  const { actor, canEdit } = useOscSheetContext();
  const { level, slots, defaultMax, occupied, prepared, spellbook, freeCasting, points } = vm;
  const [bookOpen, setBookOpen] = useState(false);

  // The pencil sits where the "ready"/"remaining" label used to, and carries that
  // label's meaning in its aria-label — the head itself is now plain text.
  const editSlots = <SlotMaxDialog level={level} max={slots.max} defaultMax={defaultMax} />;

  const meta = (spell: OseSpell) =>
    spellMeta(spell).map((p) => (
      <span key={p.kind} className={cx(p.kind === "roll" && "dmg")}>
        {p.text}
      </span>
    ));

  if (freeCasting) {
    const exhausted = points.used >= points.max;
    return (
      <div className="osc-spelllevel">
        <div className={HEAD}>
          <span className={HEAD_LV}>Level {level}</span>
          <span className={HEAD_SC}>
            {points.max - points.used} / {points.max}
          </span>
          {editSlots}
          <Pips
            total={points.max}
            filled={points.max - points.used}
            hollow
            className="slots tw:ml-auto"
            aria-hidden="true"
            glyph={<i className="fa-solid fa-diamond" />}
          />
        </div>
        {spellbook.length === 0 ? (
          <div className="osc-spell tw:text-text-faint">
            {/* spans the row, left-aligned (the grid is 1fr auto) */}
            <div className="tw:col-span-full tw:font-serif tw:text-[length:var(--fs-sm)] tw:italic">
              No spells known at this level.
            </div>
          </div>
        ) : (
          spellbook.map((spell) => (
            <SpellRow
              key={spell._id as string}
              spell={spell}
              meta={meta(spell)}
              free
              spent={exhausted}
              spentTitle="No spell points left at this level (Study to recover)"
              favorite={isFavorite(spell)}
              onToggleFavorite={canEdit ? () => void toggleFavorite(spell) : undefined}
              canCast={canEdit}
              onCast={() => castFree(actor, spell, points.max)}
              onOpenName={() => spell.sheet.render(true)}
            />
          ))
        )}
      </div>
    );
  }

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
      <div className={HEAD}>
        <span className={HEAD_LV}>Level {level}</span>
        <span className={HEAD_SC}>
          {slots.used} / {slots.max}
        </span>
        {editSlots}
        <Pips
          total={slots.max}
          filled={slots.used}
          hollow
          className="slots tw:ml-auto"
          aria-hidden="true"
          glyph={<i className="fa-solid fa-diamond" />}
        />
      </div>

      {prepared.length === 0 ? (
        <div className="osc-spell tw:text-text-faint">
          {/* spans the row, left-aligned (the grid is 1fr auto) */}
          <div className="tw:col-span-full tw:font-serif tw:text-[length:var(--fs-sm)] tw:italic">
            None memorised — open the spellbook.
          </div>
        </div>
      ) : (
        prepared.map((spell) => {
          const left = spell.system.cast ?? 0;
          const total = Math.max(spell.system.memorized ?? 0, left);
          return (
            <SpellRow
              key={spell._id as string}
              spell={spell}
              meta={meta(spell)}
              pips={{ total, filled: left }}
              spent={left <= 0}
              spentTitle={`${spell.name} — spent (Rest to recover)`}
              canCast={canEdit}
              onCast={() => cast(spell)}
              onUnprepare={canEdit ? () => unprepare(spell) : undefined}
              onOpenName={() => spell.sheet.render(true)}
            />
          );
        })
      )}

      <button
        type="button"
        className={cx(
          "osc-bookbtn tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-2 tw:border tw:border-t-0 tw:border-dashed tw:border-border tw:bg-transparent tw:px-3 tw:py-2 tw:font-display tw:text-[length:var(--fs-xs)] tw:tracking-[0.04em] tw:text-text-mute tw:hover:text-text",
          bookOpen ? "tw:rounded-none" : "tw:rounded-b-[7px]",
        )}
        onClick={() => setBookOpen((o) => !o)}
        aria-expanded={bookOpen}
      >
        <i
          className={cx(
            "fa-solid tw:text-[0.9em] tw:text-gold",
            bookOpen ? "fa-caret-down" : "fa-caret-right",
          )}
          aria-hidden="true"
        />
        Spellbook ({spellbook.length})
      </button>
      {bookOpen && (
        // 2-col once the sheet body has room, 1-col when narrow.
        <div className="osc-book tw:grid tw:grid-cols-1 tw:gap-1 tw:rounded-b-[7px] tw:border tw:border-t-0 tw:border-border-soft tw:bg-bg-2 tw:p-2 tw:@min-[470px]/sheet:grid-cols-2">
          {spellbook.length === 0 ? (
            <div className="osc-book-empty tw:col-span-full tw:px-2 tw:py-1 tw:font-serif tw:text-[length:var(--fs-sm)] tw:italic tw:text-text-faint">
              No spells known at this level.
            </div>
          ) : (
            spellbook.map((spell) => {
              // Read-only: list known spells as static rows (no memorise action).
              if (!canEdit) {
                return (
                  <span key={spell._id as string} className={`${BOOKSPELL} is-static`}>
                    <span className="bn tw:min-w-0 tw:truncate">{spell.name}</span>
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
                  className={BOOKSPELL}
                  disabled={atCapacity}
                  onClick={() => prepare(spell)}
                  title={atCapacity ? "No slots left at this level" : `Memorise ${spell.name}`}
                >
                  <span className="bn tw:min-w-0 tw:truncate">{spell.name}</span>
                  {/* own line box so the FA plus centers instead of riding the serif baseline */}
                  <span
                    className="pa tw:ml-auto tw:inline-flex tw:items-center tw:text-[0.85em] tw:leading-flush tw:text-text-faint"
                    aria-hidden="true"
                  >
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
