import { describe, it, expect } from "vitest";
import {
  spellMeta,
  selectSpellLevels,
  spellPointsSpent,
  pointsLeftAt,
  isFavorite,
  selectFavoriteSpells,
} from "@features/spells/spells";
import type { OSEActor, OseSpell } from "@domain/types";

// spellMeta only reads spell.system — build the minimal shape inline.
const spell = (system: Partial<OseSpell["system"]>) =>
  ({ system }) as OseSpell;

describe("spellMeta", () => {
  it("orders range · duration · save · roll and prefixes R/D", () => {
    const parts = spellMeta(
      spell({ range: "150'", duration: "1 turn", save: "vs spells", roll: "1d6+1" })
    );
    expect(parts).toEqual([
      { kind: "range", text: "R 150'" },
      { kind: "duration", text: "D 1 turn" },
      { kind: "save", text: "save vs spells" },
      { kind: "roll", text: "1d6+1" },
    ]);
  });

  it("renders 'no save' when there is no save, and drops empty range/duration/roll", () => {
    const parts = spellMeta(spell({ range: "", duration: "", save: "" }));
    expect(parts).toEqual([{ kind: "save", text: "no save" }]);
  });
});

const MODULE_ID = "osc-character-sheet";
const known = (id: string, lvl: number, name: string, favorite = false) =>
  ({
    _id: id,
    name,
    system: { lvl, memorized: 0, cast: 0 },
    ...(favorite ? { flags: { [MODULE_ID]: { favorite: true } } } : {}),
  }) as unknown as OseSpell;

const actorWith = (
  spellList: Record<number, OseSpell[]>,
  slots: Record<number, { used: number; max: number }>,
  spellPoints?: Record<number, number>,
) =>
  ({
    system: { spells: { spellList, slots, enabled: true } },
    ...(spellPoints ? { flags: { [MODULE_ID]: { spellPoints } } } : {}),
  }) as unknown as OSEActor;

describe("selectSpellLevels — free-casting mode", () => {
  it("carries freeCasting + a per-level point budget from slot max and the spent flag", () => {
    const actor = actorWith(
      { 1: [known("a", 1, "Cure"), known("b", 1, "Light")] },
      { 1: { used: 0, max: 3 } },
      { 1: 2 },
    );
    const [lvl1] = selectSpellLevels(actor, true);
    expect(lvl1.freeCasting).toBe(true);
    expect(lvl1.points).toEqual({ used: 2, max: 3 });
    expect(lvl1.spellbook).toHaveLength(2);
  });

  it("clamps spent points to the level's max", () => {
    const actor = actorWith({ 1: [known("a", 1, "Cure")] }, { 1: { used: 0, max: 1 } }, { 1: 5 });
    expect(selectSpellLevels(actor, true)[0].points).toEqual({ used: 1, max: 1 });
  });

  it("defaults freeCasting false with no setting (memorization is the default)", () => {
    const actor = actorWith({ 1: [known("a", 1, "Cure")] }, { 1: { used: 0, max: 2 } });
    expect(selectSpellLevels(actor, false)[0].freeCasting).toBe(false);
  });
});

describe("spell points", () => {
  it("reads the spent-points flag, empty when absent", () => {
    expect(spellPointsSpent(actorWith({}, {}))).toEqual({});
    expect(spellPointsSpent(actorWith({}, {}, { 2: 3 }))).toEqual({ 2: 3 });
  });

  it("computes points remaining, never negative", () => {
    const actor = actorWith({}, {}, { 1: 2, 2: 9 });
    expect(pointsLeftAt(actor, 1, 3)).toBe(1);
    expect(pointsLeftAt(actor, 2, 4)).toBe(0);
    expect(pointsLeftAt(actor, 3, 2)).toBe(2);
  });
});

describe("favorites", () => {
  it("reads the favorite flag off a spell", () => {
    expect(isFavorite(known("a", 1, "Cure", true))).toBe(true);
    expect(isFavorite(known("b", 1, "Light"))).toBe(false);
  });

  it("collects favorited spells across levels, sorted by level then name", () => {
    const actor = actorWith(
      {
        1: [known("a", 1, "Shield", true), known("b", 1, "Cure")],
        2: [known("c", 2, "Web", true)],
      },
      {},
    );
    expect(selectFavoriteSpells(actor).map((s) => s.name)).toEqual(["Shield", "Web"]);
  });
});
