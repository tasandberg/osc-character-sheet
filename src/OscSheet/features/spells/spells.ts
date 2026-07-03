import type { OSEActor, OseSpell } from "@domain/types";
import type { SpellLevelVM } from "@domain/vm-types";

/** One part of the prepared-row meta line, e.g. { kind: "damage", text: "1d6+1" }. */
export interface SpellMetaPart {
  kind: "range" | "duration" | "save" | "damage";
  text: string;
}

/**
 * The `R 150' · D 1 turn · no save · 1d6+1` meta line for a prepared spell.
 * Pure: range / duration / save / damage, in that order, dropping empty fields.
 * "no save" renders for spells with no save; the consumer tints `damage` crimson.
 */
export function spellMeta(spell: OseSpell): SpellMetaPart[] {
  const { range, duration, save, damage } = spell.system;
  const parts: SpellMetaPart[] = [];
  if (range) parts.push({ kind: "range", text: `R ${range}` });
  if (duration) parts.push({ kind: "duration", text: `D ${duration}` });
  parts.push({ kind: "save", text: save ? `save ${save}` : "no save" });
  if (damage) parts.push({ kind: "damage", text: damage });
  return parts;
}

/**
 * Per-level spell panels. A slot is OCCUPIED by each `memorized` copy of a spell
 * (the selection — persists across casts and rest); `cast` is the casts remaining
 * within those slots. So capacity is measured in `memorized` (NOT OSE's `slots.used`,
 * which is the sum of `cast` and frees as you cast — that would let you over-memorise).
 * The prepared list = every selected spell (`memorized > 0`), incl. fully-spent ones.
 * A level shows when it has capacity OR any known spell. Sorted ascending.
 */
export function selectSpellLevels(actor: OSEActor): SpellLevelVM[] {
  const { slots, spellList } = actor.system.spells;
  const levels = new Set<number>();
  for (const lvl of Object.keys(slots)) levels.add(Number(lvl));
  for (const lvl of Object.keys(spellList)) levels.add(Number(lvl));

  return [...levels]
    .sort((a, b) => a - b)
    .map((level) => {
      const max = (slots[level] ?? { max: 0 }).max;
      const spellbook = spellList[level] ?? [];
      // `ready` (= sum of cast) drives the "X / max ready" count + pips and drops
      // as spells are cast; `occupied` (= sum of memorized) is the filled-slot
      // count that drives capacity and persists across casts/rest.
      const ready = spellbook.reduce((n, s) => n + (s.system.cast ?? 0), 0);
      const occupied = spellbook.reduce((n, s) => n + (s.system.memorized ?? 0), 0);
      const prepared = spellbook.filter((s) => (s.system.memorized ?? 0) > 0);
      return { level, slots: { used: ready, max }, occupied, prepared, spellbook };
    })
    .filter((vm) => vm.slots.max > 0 || vm.spellbook.length > 0);
}
