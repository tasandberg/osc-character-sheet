import type { Attribute, OseClass } from "@ose-foundry-core/types";
import logger from "@src/util/logger";

/**
 * Adapts the OSE Advanced Fantasy tome's class data into the canonical
 * `OseClass` shape and stores it at `CONFIG.OSE.classes.advanced`.
 *
 * The classic-fantasy module publishes canonical defs at
 * `CONFIG.OSE.classes.classic`, but the advanced tome only exposes a different
 * raw shape on the `OSE.data.classes.advanced` global. This bridges the two so
 * osc-sheet can read every class from one canonical place.
 */

/** The advanced tome's raw per-class shape (only the fields we consume). */
interface RawAdvancedClass {
  /** Display name, e.g. "Bard". */
  menu: string;
  /** Slug, e.g. "bard" — fallback when `menu` is missing. */
  name: string;
  /** Abilities compendium pack id. */
  pack: string;
  /** HD formula per level (index 0 = level 1). */
  hdArr: string[];
  /** Saves keyed by level breakpoint ("1","5","9","13") → 5-tuple. */
  saves: Record<string, number[]>;
  /** THAC0 keyed by level breakpoint → [thac0, attackBonus]. */
  thac0: Record<string, number[]>;
  /** XP thresholds for levels 2..maxLvl (index 0 = level 2). */
  xp: number[];
  /** Free-text requirement string, e.g. "Minimum DEX 9, minimum INT 9". */
  req: string;
  spellCaster: boolean;
  /** spellSlot[level][spellLevel] = { max }. */
  spellSlot?: Record<string, Record<string, { max: number }>>;
  spellPackName?: string;
  maxLvl: number;
}

const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"] as const;
const REQ_RE = new RegExp(`(${ABILITIES.join("|")})\\s+(\\d+)`, "gi");

/** Parse "Minimum DEX 9, minimum INT 9" → { dex: 9, int: 9 }; "None"/"" → {}. */
function parseRequirements(req: string): Partial<Record<Attribute, number>> {
  const out: Partial<Record<Attribute, number>> = {};
  if (!req) return out;
  for (const [, ability, value] of req.matchAll(REQ_RE)) {
    out[ability.toLowerCase() as Attribute] = Number(value);
  }
  return out;
}

/** Value from a breakpoint table (keys "1","5",…) for the given level. */
function atBreakpoint<T>(table: Record<string, T>, level: number): T {
  const keys = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);
  let chosen = keys[0];
  for (const k of keys) if (k <= level) chosen = k;
  return table[String(chosen)];
}

/** Highest spell level (1..n) with any non-zero slot; 0 if non-caster. */
function maxSpellLevel(slots: RawAdvancedClass["spellSlot"]): number {
  let max = 0;
  if (!slots) return max;
  for (const perLevel of Object.values(slots)) {
    for (const [spellLevel, { max: m }] of Object.entries(perLevel)) {
      if (m > 0) max = Math.max(max, Number(spellLevel));
    }
  }
  return max;
}

/** Adapt one raw advanced class to the canonical `OseClass` shape. */
export function adaptAdvancedClass(raw: RawAdvancedClass): OseClass {
  const levelCount = raw.maxLvl ?? raw.hdArr.length;
  const spellLevels = raw.spellCaster ? maxSpellLevel(raw.spellSlot) : 0;

  const levels: OseClass["levels"] = [];
  for (let level = 1; level <= levelCount; level++) {
    const entry: OseClass["levels"][number] = {
      // level 1 starts at 0 XP; raw.xp[0] is the level-2 threshold.
      xp: level === 1 ? 0 : (raw.xp[level - 2] ?? 0),
      hd: raw.hdArr[level - 1],
      thac0: atBreakpoint(raw.thac0, level)[0],
      saves: atBreakpoint(raw.saves, level),
    };
    if (spellLevels > 0) {
      const perLevel = raw.spellSlot?.[String(level)] ?? {};
      entry.spells = Array.from(
        { length: spellLevels },
        (_, i) => perLevel[String(i + 1)]?.max ?? 0,
      );
    }
    levels.push(entry);
  }

  const def: OseClass = {
    name: raw.menu ?? raw.name,
    abilitiesPack: raw.pack,
    requirements: parseRequirements(raw.req),
    source: "Advanced Fantasy",
    levels,
  };
  if (raw.spellCaster && raw.spellPackName) def.spellsPack = raw.spellPackName;
  return def;
}

/** `CONFIG.OSE.classes` widened to allow the `advanced` group we add. */
type ClassesWithAdvanced = (typeof CONFIG.OSE)["classes"] & {
  advanced: Record<string, OseClass>;
};

/**
 * Boot-time adapter: if the advanced tome's raw class data is present, adapt
 * every class and store the result at `CONFIG.OSE.classes.advanced`. No-op when
 * the global is absent (tome not installed). Returns the count adapted.
 */
export function installAdvancedClasses(): number {
  const advanced = (globalThis as { OSE?: { data?: { classes?: { advanced?: Record<string, RawAdvancedClass> } } } })
    .OSE?.data?.classes?.advanced;
  if (!advanced || typeof advanced !== "object") {
    logger("No OSE.data.classes.advanced found; skipping advanced class adapter");
    return 0;
  }

  const classes = CONFIG.OSE.classes as ClassesWithAdvanced;
  const target: Record<string, OseClass> = (classes.advanced ??= {});
  for (const raw of Object.values(advanced)) {
    const def = adaptAdvancedClass(raw);
    target[def.name] = def;
  }

  const count = Object.keys(target).length;
  logger(`Adapted ${count} advanced classes into CONFIG.OSE.classes.advanced`);
  return count;
}
