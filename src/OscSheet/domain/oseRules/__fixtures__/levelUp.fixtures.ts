/**
 * @file Level-up calc fixtures (OSC-25) — the contract OSC-48's `computeLevelUp` must satisfy.
 *
 * Each case is a representative before→after advancement, sourced directly from the OSE
 * classic-fantasy class tables (`CONFIG.OSE.classes.classic`, i.e.
 * `ose-foundry-core/src/module/classes/classic-fantasy-classes.ts`). Values are hand-verified
 * against those tables; see `docs/level-up-rules.md` for the rules and field-write map.
 *
 * This file defines fixtures + types ONLY — no calc logic (that is OSC-48). It typechecks under
 * `pnpm build` so the calc module can import these cases straight into its unit tests.
 */

import type { OSESave } from "@domain/types";

/** Saving throws, in the OSE `[death, wand, paralysis, breath, spell]` order. */
export type Saves = Record<OSESave, number>;

/** Spell slots keyed by spell level (1-based) → max slots. Written as `system.spells.<lvl>.max`. */
export type SpellSlots = Record<number, number>;

/**
 * How the new level's HP was gained (deterministic inputs so the fixture is reproducible):
 * - `roll`   — one new die was rolled; `rolledHd` gives the natural die result (CON applies).
 * - `flat`   — past name level; fixed HP/level, CON does not apply, no die.
 * - `manual` — unmatched class; the user typed the HP, nothing is derivable.
 */
export type HpMode = "roll" | "flat" | "manual";

/** The computed after-state the calc should produce (maps 1:1 to the write paths in the doc). */
export interface LevelUpExpected {
  /** `system.details.level` */
  level: number;
  /** `system.details.xp.next` — `null` at max level (no further threshold). */
  xpNext: number | null;
  /** `system.hp.hd` — `null` for unmatched (not auto-written). */
  hd: string | null;
  /** `system.hp.max` after applying the delta. */
  hpMax: number;
  /** Convenience: `hpMax - before.hpMax`. */
  hpDelta: number;
  /** Whether the CON modifier was added to this level's HP (false in the flat/manual regime). */
  conApplied: boolean;
  /** `system.saves.*.value` — `null` for unmatched (not auto-written). */
  saves: Saves | null;
  /** `system.thac0.value` (descending) — `null` for unmatched. */
  thac0: number | null;
  /** `system.thac0.bba` (ascending) = `19 - thac0` — `null` for unmatched. */
  bba: number | null;
  /** `system.spells.<lvl>.max` — `null` for non-casters and unmatched. */
  spells: SpellSlots | null;
}

export interface LevelUpCase {
  /** Stable id for `it.each` / failure output. */
  id: string;
  /** Human-readable description. */
  name: string;
  /** Free-text class as stored on `system.details.class`. */
  className: string;
  /** Did the class fuzzy-match a `CONFIG.OSE.classes.*` entry? */
  matched: boolean;
  fromLevel: number;
  toLevel: number;
  /** CON score; `conMod` is the derived HP modifier (OSE `standardAttributeMods`). */
  con: number;
  conMod: number;
  hpMode: HpMode;
  /** Natural die result of the new HD, when `hpMode === "roll"`. */
  rolledHd?: number;
  /** Manual HP entered by the user, when `hpMode === "manual"`. */
  manualHp?: number;
  before: { hpMax: number; hd: string | null };
  expected: LevelUpExpected;
}

/**
 * bba is always `19 - thac0`; helper keeps the fixtures honest and self-documenting.
 * (See `ose-foundry-core/src/module/actor/entity.js:57`.)
 */
const bba = (thac0: number) => 19 - thac0;

export const LEVEL_UP_CASES: LevelUpCase[] = [
  {
    id: "mu-1-2",
    name: "Magic-User L1→L2 — spellcaster gains a die (+CON), first slot bump",
    className: "Magic-User",
    matched: true,
    fromLevel: 1,
    toLevel: 2,
    con: 13,
    conMod: 1,
    hpMode: "roll",
    rolledHd: 3, // d4
    before: { hpMax: 4, hd: "1d4" },
    expected: {
      level: 2,
      xpNext: 5000, // levels[2].xp = level-3 threshold
      hd: "2d4",
      hpMax: 8, // 4 + max(1, 3 + 1)
      hpDelta: 4,
      conApplied: true,
      saves: { death: 13, wand: 14, paralysis: 13, breath: 16, spell: 15 },
      thac0: 19,
      bba: bba(19), // 0
      spells: { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    },
  },
  {
    id: "mu-2-3-neg-con",
    name: "Magic-User L2→L3 — penalty CON yields raw (negative) delta, no min-per-level floor",
    className: "Magic-User",
    matched: true,
    fromLevel: 2,
    toLevel: 3,
    con: 3,
    conMod: -3,
    hpMode: "roll",
    rolledHd: 1, // d4; 1 + (-3) = -2, applied raw (no floor — matches OSE system)
    before: { hpMax: 5, hd: "2d4" },
    expected: {
      level: 3,
      xpNext: 10_000, // levels[3].xp = level-4 threshold
      hd: "3d4",
      hpMax: 3, // 5 + (1 + (-3)) = 5 + (-2)
      hpDelta: -2,
      conApplied: true,
      saves: { death: 13, wand: 14, paralysis: 13, breath: 16, spell: 15 },
      thac0: 19,
      bba: bba(19),
      spells: { 1: 2, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0 },
    },
  },
  {
    id: "cleric-4-5",
    name: "Cleric L4→L5 — THAC0 & saves step, slot bump (zero-CON delta)",
    className: "Cleric",
    matched: true,
    fromLevel: 4,
    toLevel: 5,
    con: 9,
    conMod: 0,
    hpMode: "roll",
    rolledHd: 4, // d6
    before: { hpMax: 14, hd: "4d6" },
    expected: {
      level: 5,
      xpNext: 25_000, // levels[5].xp = level-6 threshold
      hd: "5d6",
      hpMax: 18, // 14 + max(1, 4 + 0)
      hpDelta: 4,
      conApplied: true,
      saves: { death: 9, wand: 10, paralysis: 12, breath: 14, spell: 12 },
      thac0: 17,
      bba: bba(17), // 2
      spells: { 1: 2, 2: 2, 3: 0, 4: 0, 5: 0 },
    },
  },
  {
    id: "cleric-8-9-boundary",
    name: "Cleric L8→L9 — last die gain at the name-level boundary (+CON still applies)",
    className: "Cleric",
    matched: true,
    fromLevel: 8,
    toLevel: 9, // == nameLevel(9): still a die + CON
    con: 15,
    conMod: 1,
    hpMode: "roll",
    rolledHd: 6, // d6
    before: { hpMax: 30, hd: "8d6" },
    expected: {
      level: 9,
      xpNext: 300_000, // levels[9].xp = level-10 threshold
      hd: "9d6",
      hpMax: 37, // 30 + max(1, 6 + 1)
      hpDelta: 7,
      conApplied: true,
      saves: { death: 6, wand: 7, paralysis: 9, breath: 11, spell: 9 },
      thac0: 14,
      bba: bba(14), // 5
      spells: { 1: 3, 2: 3, 3: 3, 4: 2, 5: 2 },
    },
  },
  {
    id: "fighter-2-3",
    name: "Fighter L2→L3 — pure fighter, +CON die, no spells",
    className: "Fighter",
    matched: true,
    fromLevel: 2,
    toLevel: 3,
    con: 16,
    conMod: 2,
    hpMode: "roll",
    rolledHd: 5, // d8
    before: { hpMax: 12, hd: "2d8" },
    expected: {
      level: 3,
      xpNext: 8000, // levels[3].xp = level-4 threshold
      hd: "3d8",
      hpMax: 19, // 12 + max(1, 5 + 2)
      hpDelta: 7,
      conApplied: true,
      saves: { death: 12, wand: 13, paralysis: 14, breath: 15, spell: 16 },
      thac0: 19,
      bba: bba(19),
      spells: null,
    },
  },
  {
    id: "fighter-9-10-flat",
    name: "Fighter L9→L10 — crosses name level: flat +2, CON no longer applies",
    className: "Fighter",
    matched: true,
    fromLevel: 9,
    toLevel: 10, // > nameLevel(9): flat regime
    con: 18,
    conMod: 3, // ignored — flat regime drops CON
    hpMode: "flat",
    before: { hpMax: 45, hd: "9d8" },
    expected: {
      level: 10,
      xpNext: 480_000, // levels[10].xp = level-11 threshold
      hd: "9d8+2",
      hpMax: 47, // 45 + 2 (flat), CON ignored
      hpDelta: 2,
      conApplied: false,
      saves: { death: 6, wand: 7, paralysis: 8, breath: 8, spell: 10 },
      thac0: 19,
      bba: bba(19),
      spells: null,
    },
  },
  {
    id: "mu-9-10-flat",
    name: "Magic-User L9→L10 — caster crosses name level: flat +1, slots still bump",
    className: "Magic-User",
    matched: true,
    fromLevel: 9,
    toLevel: 10, // > nameLevel(9)
    con: 15,
    conMod: 1, // ignored in flat regime
    hpMode: "flat",
    before: { hpMax: 22, hd: "9d4" },
    expected: {
      level: 10,
      xpNext: 600_000, // levels[10].xp = level-11 threshold
      hd: "9d4+1",
      hpMax: 23, // 22 + 1 (flat)
      hpDelta: 1,
      conApplied: false,
      saves: { death: 11, wand: 12, paralysis: 11, breath: 14, spell: 12 },
      thac0: 17,
      bba: bba(17), // 2
      spells: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 0 },
    },
  },
  {
    id: "thief-13-14-max",
    name: "Thief L13→L14 — max level: flat +2, no next XP threshold",
    className: "Thief",
    matched: true,
    fromLevel: 13,
    toLevel: 14, // == levels.length → max level
    con: 12,
    conMod: 0, // flat regime anyway
    hpMode: "flat",
    before: { hpMax: 40, hd: "9d4+8" },
    expected: {
      level: 14,
      xpNext: null, // levels[14] is undefined at max level
      hd: "9d4+10",
      hpMax: 42, // 40 + 2 (flat)
      hpDelta: 2,
      conApplied: false,
      saves: { death: 8, wand: 9, paralysis: 7, breath: 10, spell: 8 },
      thac0: 12,
      bba: bba(12), // 7
      spells: null,
    },
  },
  {
    id: "unmatched-bard",
    name: "Bard L3→L4 — unmatched free-text class: degrade to manual HP-only",
    className: "Bard", // no CONFIG.OSE.classes match
    matched: false,
    fromLevel: 3,
    toLevel: 4,
    con: 13,
    conMod: 1, // no HD known → CON can't be auto-applied; user types the HP
    hpMode: "manual",
    manualHp: 6,
    before: { hpMax: 14, hd: null },
    expected: {
      level: 4, // only level + hp.max are written
      xpNext: null, // no table → no threshold
      hd: null, // not auto-written
      hpMax: 20, // 14 + manualHp(6)
      hpDelta: 6,
      conApplied: false,
      saves: null, // not auto-written
      thac0: null, // not auto-written
      bba: null,
      spells: null,
    },
  },
];
