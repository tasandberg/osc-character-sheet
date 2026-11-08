import type { OseClass } from "@ose-foundry-core/types";
import type {
  OSEActor,
  OseClassItem,
  OseRaceItem,
  OSESave,
} from "@domain/types";

const SAVE_ORDER: OSESave[] = ["death", "wand", "paralysis", "breath", "spell"];

type ClassDef = Pick<OseClass, "levels" | "requirements">;

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

export type Progression = {
  source: "item" | "config" | "custom";
  classes: OseClassItem[];
  race: OseRaceItem | null;
  derived: boolean;
};

export function selectProgression(actor: OSEActor): Progression {
  const classes = actor.system.classes ?? [];
  const race = actor.system.race ?? null;
  const derived = actor.system.derivedFromClasses === true;
  const source = classes.length
    ? "item"
    : findClass(actor.system.details?.class ?? "")
      ? "config"
      : "custom";
  return { source, classes, race, derived };
}

const currentRows = (classes: OseClassItem[]) =>
  classes.flatMap((c) => c.system.currentRow ?? []);

/** Rulebook slot maxima for the actor's class+level, keyed by spell level (1-based). */
export function selectSpellSlotDefaults(
  actor: OSEActor,
): Record<number, number> | null {
  const progression = selectProgression(actor);
  if (progression.source === "item") {
    const slots: Record<number, number> = {};
    for (const row of currentRows(progression.classes))
      for (const [lvl, count] of Object.entries<number>(row.spellSlots ?? {}))
        slots[Number(lvl)] = (slots[Number(lvl)] ?? 0) + (count || 0);
    return Object.keys(slots).length ? slots : null;
  }
  const { class: cls, level } = actor.system?.details ?? {};
  const spells = findClass(cls ?? "")?.def.levels[(level ?? 0) - 1]?.spells;
  if (!spells) return null;
  return Object.fromEntries(spells.map((max, i) => [i + 1, max ?? 0]));
}

export function selectUntabledNextXp(actor: OSEActor): number | null {
  const first = actor.system.classes?.[0];
  if (!first || first.system.levels?.length) return null;
  return actor._source?.system?.details?.xp?.next ?? 0;
}

function classItemDefaults(
  classes: OseClassItem[],
  untabledNextXp: number | null,
): ClassDefaults {
  const rows = currentRows(classes);
  const first = classes[0].system;
  const requirements: Record<string, number> = {};
  for (const c of classes)
    for (const [score, bounds] of Object.entries(c.system.requirements ?? {}))
      if (bounds?.min != null)
        requirements[score] = Math.max(requirements[score] ?? 0, bounds.min);
  const tabled = rows.length > 0;
  return {
    matched: tabled,
    maxLevel: first.maxLevel ?? 14,
    hd: tabled ? rows.map((row) => row.hd).join(" / ") : null,
    levelXp: first.currentRow?.xp ?? null,
    nextXp: first.nextRow?.xp ?? (untabledNextXp || null),
    saves: tabled
      ? (Object.fromEntries(
          SAVE_ORDER.map((k) => [k, Math.min(...rows.map((r) => r.saves[k]))]),
        ) as Record<OSESave, number>)
      : null,
    thac0: tabled ? Math.min(...rows.map((r) => r.thac0)) : null,
    requirements,
  };
}

export function selectClassDefaults(actor: OSEActor): ClassDefaults {
  const progression = selectProgression(actor);
  if (progression.source === "item")
    return classItemDefaults(progression.classes, selectUntabledNextXp(actor));
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

type DescribeDerivation = (
  classes: OseClassItem[],
  finals: { saves: Record<string, number>; thac0: number; bba: number },
) => Record<string, string>;

export function selectDerivation(actor: OSEActor): Record<string, string> {
  if (!actor.system.derivedFromClasses) return {};
  const describe = (
    game as unknown as { ose?: { describeDerivation?: DescribeDerivation } }
  ).ose?.describeDerivation;
  if (!describe) return {};
  const { saves, thac0, classes = [] } = actor.system;
  return describe(classes, {
    saves: Object.fromEntries(
      Object.entries(saves).map(([key, save]) => [key, save.value]),
    ),
    thac0: thac0.value,
    bba: thac0.bba,
  });
}

export function selectHdParts(
  actor: OSEActor,
): { name: string; hd: string }[] | undefined {
  const parts = (actor.system.classes ?? []).flatMap((c) =>
    c.system.currentRow?.hd
      ? [{ name: c.name as string, hd: c.system.currentRow.hd }]
      : [],
  );
  return parts.length > 1 ? parts : undefined;
}
