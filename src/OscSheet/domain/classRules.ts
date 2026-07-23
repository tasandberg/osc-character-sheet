import type { OSEActor, OSESave } from "@domain/types";

const SAVE_ORDER: OSESave[] = ["death", "wand", "paralysis", "breath", "spell"];

type ClassDef = {
  levels: { xp: number; hd: string; thac0: number; saves: number[] }[];
  /** Minimum ability scores required by the class, e.g. { cha: 9 }. */
  requirements?: Record<string, number>;
};

export type ClassDefaults = {
  matched: boolean;
  maxLevel: number;
  hd: string | null;
  /** XP floor for the current level (start of this level's band). */
  levelXp: number | null;
  /** XP needed to reach the next level; null at max level. */
  nextXp: number | null;
  saves: Record<OSESave, number> | null;
  /** Descending THAC0 for the current level; null for custom/unmatched. */
  thac0: number | null;
  /** Minimum ability scores required by the class (ability key → min). */
  requirements: Record<string, number>;
};

const canon = (s: string) =>
  (s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, " ");

/**
 * Class-definition maps to search, in priority order. Advanced Fantasy classes
 * (adapted into `CONFIG.OSE.classes.advanced` when the tome is installed) share
 * the canonical OseClass shape with classic and are preferred — so an advanced
 * character (e.g. Paladin, or an advanced-rules Fighter) gets its rulebook
 * defaults. Falls back to classic; both maps are absent → no defaults.
 */
function classMaps(): Record<string, ClassDef>[] {
  const c = (CONFIG.OSE?.classes ?? {}) as {
    advanced?: unknown;
    classic?: unknown;
  };
  return [c.advanced, c.classic].filter(Boolean) as Record<string, ClassDef>[];
}

function findClass(raw: string): { key: string; def: ClassDef } | null {
  const want = canon(raw);
  if (!want) return null;
  for (const map of classMaps()) {
    const key = Object.keys(map).find((k) => canon(k) === want);
    if (key) return { key, def: map[key] };
  }
  return null;
}

/** Canonical class name (key) matching `raw`, searching advanced then classic. */
export function normalizeClassName(raw: string): string | null {
  return findClass(raw)?.key ?? null;
}

/**
 * Provenance of a class name: `advanced` (Advanced Fantasy tome), `classic`
 * (core rules), or `custom` (not in either CONFIG map). Advanced wins when a
 * name lives in both, mirroring `classMaps` priority.
 */
export function classSource(name: string): "classic" | "advanced" | "custom" {
  const want = canon(name);
  if (!want) return "custom";
  const c = (CONFIG.OSE?.classes ?? {}) as {
    advanced?: unknown;
    classic?: unknown;
  };
  const has = (m: unknown) =>
    !!m && Object.keys(m as object).some((k) => canon(k) === want);
  if (has(c.advanced)) return "advanced";
  if (has(c.classic)) return "classic";
  return "custom";
}

/** All class names available in CONFIG.OSE.classes (advanced + classic), unique + sorted. */
export function availableClassNames(): string[] {
  const names = new Set<string>();
  for (const map of classMaps()) for (const k of Object.keys(map)) names.add(k);
  return [...names].sort((a, b) => a.localeCompare(b));
}

export function selectClassDefaults(actor: OSEActor): ClassDefaults {
  const { class: cls, level } = actor.system.details;
  const def = findClass(cls)?.def;
  if (!def)
    return {
      matched: false,
      maxLevel: 14,
      hd: null,
      levelXp: null,
      nextXp: null,
      saves: null,
      thac0: null,
      requirements: {},
    };

  const row = def.levels[level - 1];
  const nextRow = def.levels[level]; // 0-indexed: index `level` is the next level
  const saves = row
    ? (Object.fromEntries(
        SAVE_ORDER.map((k, i) => [k, row.saves[i]]),
      ) as Record<OSESave, number>)
    : null;
  return {
    matched: true,
    maxLevel: def.levels.length,
    hd: row?.hd ?? null,
    levelXp: row?.xp ?? null,
    nextXp: nextRow?.xp ?? null,
    saves,
    thac0: row?.thac0 ?? null,
    requirements: def.requirements ?? {},
  };
}
