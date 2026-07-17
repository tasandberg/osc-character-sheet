import type { OSEActor, OseSpell } from "@domain/types";
import type { SpellLevelVM } from "@domain/vm-types";
import { MODULE_ID, FLAGS, readFlag, setFlag, unsetFlag } from "@domain/flags";

/** One part of the prepared-row meta line, e.g. { kind: "roll", text: "1d6+1" }. */
export interface SpellMetaPart {
  kind: "range" | "duration" | "save" | "roll";
  text: string;
}

/**
 * The `R 150' · D 1 turn · no save · 1d6+1` meta line for a prepared spell.
 * Pure: range / duration / save / roll formula, in that order, dropping empty fields.
 * "no save" renders for spells with no save; the consumer tints the roll formula crimson.
 */
export function spellMeta(spell: OseSpell): SpellMetaPart[] {
  const { range, duration, save, roll } = spell.system;
  const parts: SpellMetaPart[] = [];
  if (range) parts.push({ kind: "range", text: `R ${range}` });
  if (duration) parts.push({ kind: "duration", text: `D ${duration}` });
  parts.push({ kind: "save", text: save ? `save ${save}` : "no save" });
  if (roll) parts.push({ kind: "roll", text: roll });
  return parts;
}

/** World setting: memorization disabled → free-casting mode. Safe in non-Foundry tests. */
export function memorizationDisabled(): boolean {
  try {
    const settings = (globalThis as { game?: { settings?: { get(ns: string, key: string): unknown } } }).game
      ?.settings;
    return !!settings?.get(MODULE_ID, "disableMemorization");
  } catch {
    return false;
  }
}

/** Per-level points spent this "day" (free-casting). Reads the actor's `spellPoints` flag. */
export function spellPointsSpent(actor: OSEActor): Record<number, number> {
  return readFlag<Record<number, number>>(actor, FLAGS.spellPoints) ?? {};
}

/** Casts still available at a level in free-casting mode (slot max − points spent). */
export function pointsLeftAt(actor: OSEActor, level: number, max: number): number {
  return Math.max(0, max - (spellPointsSpent(actor)[level] ?? 0));
}

/** Cast a known spell in free-casting mode: spend one level point, then post its card. */
export async function castFree(actor: OSEActor, spell: OseSpell, max: number): Promise<void> {
  const level = spell.system.lvl;
  if (pointsLeftAt(actor, level, max) <= 0) return;
  const spent = spellPointsSpent(actor);
  await setFlag(actor, FLAGS.spellPoints, { ...spent, [level]: (spent[level] ?? 0) + 1 });
  await (spell.system.roll ? spell.rollFormula() : spell.show());
}

/** Rest in free-casting mode: clear all spent points. */
export function resetSpellPoints(actor: OSEActor): Promise<unknown> {
  return unsetFlag(actor, FLAGS.spellPoints);
}

/** Whether a spell is favorited (shown on the Actions tab in free-casting mode). */
export function isFavorite(spell: OseSpell): boolean {
  return !!readFlag<boolean>(spell, FLAGS.favorite);
}

/** Toggle a spell's favorite flag. */
export function toggleFavorite(spell: OseSpell): Promise<unknown> {
  return isFavorite(spell)
    ? unsetFlag(spell, FLAGS.favorite)
    : setFlag(spell, FLAGS.favorite, true);
}

/** Favorited spells across all levels, sorted by level then name (Actions tab, free-casting). */
export function selectFavoriteSpells(actor: OSEActor): OseSpell[] {
  // spellList is already name-sorted per level (OSE data model), so a stable
  // level sort keeps favorites grouped by level, alphabetical within each.
  const all: OseSpell[] = Object.values(actor.system.spells?.spellList ?? {}).flat();
  return all.filter(isFavorite).sort((a, b) => a.system.lvl - b.system.lvl);
}

/**
 * Per-level spell panels. A slot is OCCUPIED by each `memorized` copy of a spell
 * (the selection — persists across casts and rest); `cast` is the casts remaining
 * within those slots. So capacity is measured in `memorized` (NOT OSE's `slots.used`,
 * which is the sum of `cast` and frees as you cast — that would let you over-memorise).
 * The prepared list = every selected spell (`memorized > 0`), incl. fully-spent ones.
 * A level shows when it has capacity OR any known spell. Sorted ascending.
 */
export function selectSpellLevels(actor: OSEActor, freeCasting = memorizationDisabled()): SpellLevelVM[] {
  const { slots, spellList } = actor.system.spells;
  const spent = spellPointsSpent(actor);
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
      const points = { used: Math.min(spent[level] ?? 0, max), max };
      return { level, slots: { used: ready, max }, occupied, prepared, spellbook, freeCasting, points };
    })
    .filter((vm) => vm.slots.max > 0 || vm.spellbook.length > 0);
}
