import { useState } from "react";
import { useOscSheetContext } from "@app/context";
import type { OseSpell } from "@domain/types";
import type { SpellLevelVM } from "@domain/vm-types";
import { spellMeta, castFree, isFavorite, toggleFavorite } from "@features/spells/spells";
import { SpellRow } from "@features/spells/SpellRow";
import { SlotMaxDialog } from "@features/spells/SlotMaxDialog";
import { showDeleteDialog } from "@domain/foundryDialogs";
import { IconButton } from "@ui/IconButton";
import { cx } from "@ui/cx";
import { Pips } from "@ui/Pips";
import { InlineButton } from "@ui/InlineButton";

// --- level head: badge · ready count · slot pips ---
const HEAD =
  "osc-spellhead tw:flex tw:items-center tw:gap-2 tw:rounded-t-[7px] tw:border tw:border-border-soft tw:bg-surface-2 tw:px-3 tw:py-[7px]";
/** `--stamp-text` is the light on-ink cream (same as the save stamps) — it reads
 *  on the ink chip in BOTH themes and is lighter than the gold accent. */
const HEAD_LV =
  "lv tw:rounded-sm tw:bg-ink tw:px-2 tw:pt-[3px] tw:pb-[2px] tw:font-display tw:text-[length:var(--fs-xs)] tw:tracking-[0.06em] tw:text-stamp-text";
const HEAD_SC = "sc tw:font-mono tw:text-[length:var(--fs-xs)] tw:text-text-mute";

/** Spellbook entry — a full-width dashed card. Inert itself: the actions are the
 *  Memorize button and, when the sheet is editable, a delete. */
const BOOKSPELL =
  "osc-bookspell tw:flex tw:items-center tw:gap-2 tw:rounded-[5px] tw:border tw:border-dashed tw:border-border-soft tw:bg-surface tw:px-2 tw:py-[5px] tw:text-left tw:font-serif tw:text-[length:var(--fs-sm)] tw:text-text-dim";
/** Empty state, framed like a row — `.osc-spell` carries no box of its own, so
 *  the bare markup this replaced fell outside the panel. */
const EMPTY_ROW =
  "osc-spell-empty tw:border tw:border-t-0 tw:border-border-soft tw:bg-surface tw:px-3 tw:py-2 tw:font-serif tw:text-[length:var(--fs-sm)] tw:italic tw:text-text-faint";

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

  const editSlots = <SlotMaxDialog level={level} max={slots.max} defaultMax={defaultMax} />;

  const remove = (spell: OseSpell) => showDeleteDialog(spell);

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
          <div className={cx(EMPTY_ROW, "tw:rounded-b-[7px]")}>
            No spells at this level.
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
              onDelete={canEdit ? () => remove(spell) : undefined}
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
  const empty = spellbook.length === 0;

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
        <div className={cx(EMPTY_ROW, empty && "tw:rounded-b-[7px]")}>
          {empty ? "No spells at this level." : "None memorised — open the spellbook."}
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

      {!empty && (
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
      )}
      {bookOpen && !empty && (
        <div className="osc-book tw:flex tw:flex-col tw:gap-1 tw:rounded-b-[7px] tw:border tw:border-t-0 tw:border-border-soft tw:bg-bg-2 tw:p-2">
          {spellbook.map((spell) => {
            // Read-only: list known spells as static rows (no memorise action).
            if (!canEdit) {
              return (
                <span key={spell._id as string} className={`${BOOKSPELL} is-static`}>
                  <span className="bn tw:min-w-0 tw:flex-1 tw:truncate">{spell.name}</span>
                </span>
              );
            }
            // Memorising ADDS a copy up to the level's free slots — never a
            // toggle, and no "prepared" highlight (an added copy shows up in the
            // prepared rows above).
            return (
              <div key={spell._id as string} className={BOOKSPELL}>
                <span className="bn tw:min-w-0 tw:flex-1 tw:truncate">{spell.name}</span>
                <InlineButton
                  className="osc-bookspell-memorise tw:font-sans tw:text-[length:var(--fs-2xs)] tw:disabled:cursor-not-allowed tw:disabled:opacity-40"
                  disabled={atCapacity}
                  onClick={() => prepare(spell)}
                  title={atCapacity ? "No slots left at this level" : `Memorize ${spell.name}`}
                >
                  Memorize
                </InlineButton>
                <IconButton
                  variant="danger"
                  size="sm"
                  className="sp-delete"
                  onClick={() => remove(spell)}
                  title={`Delete ${spell.name}`}
                  aria-label={`Delete ${spell.name}`}
                >
                  <i className="fa-solid fa-trash-can" aria-hidden="true" />
                </IconButton>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
