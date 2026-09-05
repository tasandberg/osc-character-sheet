import type {
  OSEActor,
  OscSheetContextValue,
  OseItem,
  OseSpell,
} from "@domain/types";
import type { SpellLevelVM } from "@domain/vm-types";
import {
  MODULE_ID,
  FLAGS,
  flagPath,
  readFlag,
  setFlag,
  unsetFlag,
} from "@domain/flags";
import { selectSpellSlotDefaults } from "@domain/classRules";
import { isFavorite } from "@domain/favorites";
import { createOwnedItem } from "@domain/createOwnedItem";

export { isFavorite, toggleFavorite } from "@domain/favorites";

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
    const settings = (
      globalThis as {
        game?: { settings?: { get(ns: string, key: string): unknown } };
      }
    ).game?.settings;
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
export function pointsLeftAt(
  actor: OSEActor,
  level: number,
  max: number,
): number {
  return Math.max(0, max - (spellPointsSpent(actor)[level] ?? 0));
}

/** Cast a known spell in free-casting mode: spend one level point, then post its card. */
export async function castFree(
  actor: OSEActor,
  spell: OseSpell,
  max: number,
): Promise<void> {
  const level = spell.system.lvl;
  if (pointsLeftAt(actor, level, max) <= 0) return;
  const spent = spellPointsSpent(actor);
  await setFlag(actor, FLAGS.spellPoints, {
    ...spent,
    [level]: (spent[level] ?? 0) + 1,
  });
  await (spell.system.roll ? spell.rollFormula() : spell.show());
}

type Optimistic = NonNullable<OscSheetContextValue["optimisticUpdate"]>;

/** Set a prepared spell's remaining casts directly (pip click), clamped to its
 *  slots. With `optimistic`, the value overlays instantly and the write defers. */
export function setCasts(
  spell: OseSpell,
  casts: number,
  optimistic?: Optimistic,
): Promise<unknown> | void {
  const max = Math.max(spell.system.memorized ?? 0, spell.system.cast ?? 0);
  const patch = { "system.cast": Math.min(Math.max(casts, 0), max) };
  const commit = () => spell.update(patch);
  if (!optimistic) return commit();
  optimistic(spell._id as string, patch, commit);
}

/** Set a level's remaining free-casting points directly (pip click). The
 *  optimistic patch targets the per-level leaf so reconciliation can compare
 *  primitives; the commit still writes the merged map via setFlag. */
export function setPointsLeftAt(
  actor: OSEActor,
  level: number,
  left: number,
  max: number,
  optimistic?: Optimistic,
): Promise<unknown> | void {
  const used = Math.min(Math.max(max - left, 0), max);
  const commit = () =>
    setFlag(actor, FLAGS.spellPoints, {
      ...spellPointsSpent(actor),
      [level]: used,
    });
  if (!optimistic) return commit();
  optimistic(
    "actor",
    { [`${flagPath(FLAGS.spellPoints)}.${level}`]: used },
    commit,
  );
}

/** Pip-click toast copy: "N <noun> remaining", null on no-op. */
export function pipMessage(
  noun: string,
  prevLeft: number,
  nextLeft: number,
  max: number,
): string | null {
  const next = Math.min(Math.max(nextLeft, 0), max);
  if (next === prevLeft) return null;
  return `${next} ${noun} remaining`;
}

/** Create a blank spell on the actor and open it. OSE's template defaults it to level 1. */
export function createSpell(actor: OSEActor): Promise<void> {
  return createOwnedItem(actor, "spell");
}

/** Rest in free-casting mode: clear all spent points. */
export function resetSpellPoints(actor: OSEActor): Promise<unknown> {
  return unsetFlag(actor, FLAGS.spellPoints);
}

/** The casts (or free-casting points) a Rest/Study would give back. Pure — the
 *  count `restoreAllSpells` reports, without writing anything. */
export function countRestorableSpells(levels: SpellLevelVM[]): number {
  if (levels.some((l) => l.freeCasting))
    return levels.reduce(
      (n, l) => n + Math.min(l.points.used, l.points.max),
      0,
    );
  return levels.reduce(
    (n, l) =>
      n +
      l.spellbook.reduce(
        (m, s) =>
          m + Math.max(0, (s.system.memorized ?? 0) - (s.system.cast ?? 0)),
        0,
      ),
    0,
  );
}

/** Rest/Study: free-casting refills every level's point pool; memorization mode
 *  re-memorises every spell (cast back to memorized). `spellsRestored` counts
 *  the casts (or points) given back. */
export async function restoreAllSpells(
  actor: OSEActor,
  items?: OseItem[],
): Promise<{ spellsRestored: number }> {
  const levels = selectSpellLevels(actor, undefined, items);
  const spellsRestored = countRestorableSpells(levels);
  if (levels.some((l) => l.freeCasting)) {
    await resetSpellPoints(actor);
    return { spellsRestored };
  }
  const updates: Promise<unknown>[] = [];
  for (const { spellbook } of levels) {
    for (const spell of spellbook) {
      const memorized = spell.system.memorized ?? 0;
      if ((spell.system.cast ?? 0) !== memorized)
        updates.push(spell.update({ "system.cast": memorized }));
    }
  }
  await Promise.all(updates);
  return { spellsRestored };
}

/** Favorited spells across all levels, sorted by level then name (Actions tab, free-casting). */
export function selectFavoriteSpells(actor: OSEActor): OseSpell[] {
  // spellList is already name-sorted per level (OSE data model), so a stable
  // level sort keeps favorites grouped by level, alphabetical within each.
  const all: OseSpell[] = Object.values(
    actor.system.spells?.spellList ?? {},
  ).flat();
  return all.filter(isFavorite).sort((a, b) => a.system.lvl - b.system.lvl);
}

/** Dot-path for a level's stored slot maximum (the manual override). */
export function slotMaxPath(level: number): string {
  return `system.spells.${level}.max`;
}

/** The level's stored maximum, or undefined if never set. Read from `_source`:
 *  prepared `spells.slots` fills every level with `max: 0` and can't say which. */
function storedSlotMax(actor: OSEActor, level: number): number | undefined {
  const source = (
    actor._source?.system as unknown as
      | { spells?: Record<string, { max?: number } | undefined> }
      | undefined
  )?.spells;
  if (source) {
    const max = source[String(level)]?.max;
    return typeof max === "number" ? max : undefined;
  }
  const prepared = actor.system.spells.slots[level]?.max ?? 0;
  return prepared > 0 ? prepared : undefined;
}

/** A level's effective slot maximum: the stored override, else the class default. */
export function slotMaxAt(actor: OSEActor, level: number): number {
  return (
    storedSlotMax(actor, level) ?? selectSpellSlotDefaults(actor)?.[level] ?? 0
  );
}

/**
 * Per-level spell panels. A slot is OCCUPIED by each `memorized` copy of a spell
 * (the selection — persists across casts and rest); `cast` is the casts remaining
 * within those slots. So capacity is measured in `memorized` (NOT OSE's `slots.used`,
 * which is the sum of `cast` and frees as you cast — that would let you over-memorise).
 * The prepared list = every selected spell (`memorized > 0`), incl. fully-spent ones.
 * A level shows when it has capacity OR any known spell. Sorted ascending.
 * Capacity falls back to the class+level default: nothing ever writes one.
 */
export function selectSpellLevels(
  actor: OSEActor,
  freeCasting = memorizationDisabled(),
  items?: OseItem[],
): SpellLevelVM[] {
  const { slots, spellList } = actor.system.spells;
  const byId = new Map(items?.map((it) => [it._id as string, it]) ?? []);
  const resolve = (s: OseSpell) =>
    (byId.get(s._id as string) as OseSpell | undefined) ?? s;
  const spent = spellPointsSpent(actor);
  const defaults = selectSpellSlotDefaults(actor) ?? {};
  const levels = new Set<number>();
  for (const lvl of Object.keys(slots)) levels.add(Number(lvl));
  for (const lvl of Object.keys(spellList)) levels.add(Number(lvl));
  // A caster's levels show before any spell is known.
  for (const [lvl, max] of Object.entries(defaults))
    if (max > 0) levels.add(Number(lvl));

  return [...levels]
    .sort((a, b) => a - b)
    .map((level) => {
      const stored = storedSlotMax(actor, level);
      const defaultMax = defaults[level] ?? null;
      const max = stored ?? defaultMax ?? 0;
      const spellbook = (spellList[level] ?? []).map(resolve);
      // `ready` (= sum of cast) drives the "X / max ready" count + pips and drops
      // as spells are cast; `occupied` (= sum of memorized) is the filled-slot
      // count that drives capacity and persists across casts/rest.
      const ready = spellbook.reduce((n, s) => n + (s.system.cast ?? 0), 0);
      const occupied = spellbook.reduce(
        (n, s) => n + (s.system.memorized ?? 0),
        0,
      );
      const prepared = spellbook.filter((s) => (s.system.memorized ?? 0) > 0);
      const points = { used: Math.min(spent[level] ?? 0, max), max };
      return {
        level,
        slots: { used: ready, max },
        defaultMax,
        occupied,
        prepared,
        spellbook,
        freeCasting,
        points,
      };
    })
    .filter((vm) => vm.slots.max > 0 || vm.spellbook.length > 0);
}
