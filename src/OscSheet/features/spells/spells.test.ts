import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  spellMeta,
  selectSpellLevels,
  slotMaxAt,
  spellPointsSpent,
  pointsLeftAt,
  isFavorite,
  selectFavoriteSpells,
  createSpell,
  setCasts,
  setPointsLeftAt,
} from "@features/spells/spells";
import type { OSEActor, OseSpell } from "@domain/types";

// spellMeta only reads spell.system — build the minimal shape inline.
const spell = (system: Partial<OseSpell["system"]>) => ({ system }) as OseSpell;

describe("spellMeta", () => {
  it("orders range · duration · save · roll and prefixes R/D", () => {
    const parts = spellMeta(
      spell({
        range: "150'",
        duration: "1 turn",
        save: "vs spells",
        roll: "1d6+1",
      }),
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

// A caster whose slot maxima were never typed in by hand: `slots` is all zeroes
// and `_source.system.spells` has no entry for the level — the state every new
// character starts in.
const CLERIC = {
  name: "Cleric",
  requirements: {},
  levels: [
    {
      xp: 0,
      hd: "1d6",
      thac0: 19,
      saves: [11, 12, 14, 16, 15],
      spells: [0, 0],
    },
    {
      xp: 1500,
      hd: "2d6",
      thac0: 19,
      saves: [11, 12, 14, 16, 15],
      spells: [1, 0],
    },
    {
      xp: 3000,
      hd: "3d6",
      thac0: 19,
      saves: [11, 12, 14, 16, 15],
      spells: [2, 1],
    },
  ],
};

const withClasses = () => {
  (globalThis as unknown as { CONFIG: unknown }).CONFIG = {
    OSE: { classes: { classic: { Cleric: CLERIC } } },
  };
};
afterEach(() => {
  delete (globalThis as unknown as { CONFIG?: unknown }).CONFIG;
});

const caster = (
  cls: string,
  level: number,
  spellList: Record<number, OseSpell[]>,
  storedSlots: Record<number, { max?: number }> = {},
) =>
  ({
    system: {
      details: { class: cls, level },
      spells: {
        spellList,
        // What OSE's data model derives: every level present, max 0 unless stored.
        slots: Object.fromEntries(
          [1, 2].map((l) => [l, { used: 0, max: storedSlots[l]?.max ?? 0 }]),
        ),
        enabled: true,
      },
    },
    _source: { system: { spells: storedSlots } },
  }) as unknown as OSEActor;

describe("selectSpellLevels — slot capacity", () => {
  it("falls back to the class+level slot table when nothing is stored", () => {
    withClasses();
    const actor = caster("Cleric", 3, { 1: [known("a", 1, "Cure")] });
    const [lvl1, lvl2] = selectSpellLevels(actor, false);
    expect(lvl1.slots.max).toBe(2);
    expect(lvl1.defaultMax).toBe(2);
    // Capacity is what gates memorising — 0 here is the bug that blocked it.
    expect(lvl1.occupied < lvl1.slots.max).toBe(true);
    expect(lvl2.slots.max).toBe(1);
  });

  it("shows a caster's rulebook levels before any spell is known", () => {
    withClasses();
    expect(
      selectSpellLevels(caster("Cleric", 3, {}), false).map((l) => l.level),
    ).toEqual([1, 2]);
  });

  it("prefers a stored maximum over the class default", () => {
    withClasses();
    const actor = caster(
      "Cleric",
      3,
      { 1: [known("a", 1, "Cure")] },
      { 1: { max: 5 } },
    );
    const [lvl1] = selectSpellLevels(actor, false);
    expect(lvl1.slots.max).toBe(5);
    expect(lvl1.defaultMax).toBe(2);
  });

  it("honours a stored zero — a house rule can take slots away", () => {
    withClasses();
    const actor = caster(
      "Cleric",
      3,
      { 1: [known("a", 1, "Cure")] },
      { 1: { max: 0 } },
    );
    expect(selectSpellLevels(actor, false)[0].slots.max).toBe(0);
  });

  it("has no default for a custom class, so a stored maximum is the only source", () => {
    withClasses();
    const actor = caster(
      "Warlock",
      3,
      { 1: [known("a", 1, "Cure")] },
      { 1: { max: 3 } },
    );
    const [lvl1] = selectSpellLevels(actor, false);
    expect(lvl1.defaultMax).toBeNull();
    expect(lvl1.slots.max).toBe(3);
  });

  it("slotMaxAt agrees with the panel's max", () => {
    withClasses();
    expect(slotMaxAt(caster("Cleric", 3, {}), 1)).toBe(2);
    expect(slotMaxAt(caster("Cleric", 1, {}), 1)).toBe(0);
  });
});

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
    const actor = actorWith(
      { 1: [known("a", 1, "Cure")] },
      { 1: { used: 0, max: 1 } },
      { 1: 5 },
    );
    expect(selectSpellLevels(actor, true)[0].points).toEqual({
      used: 1,
      max: 1,
    });
  });

  it("defaults freeCasting false with no setting (memorization is the default)", () => {
    const actor = actorWith(
      { 1: [known("a", 1, "Cure")] },
      { 1: { used: 0, max: 2 } },
    );
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

describe("setCasts", () => {
  const spellWith = (memorized: number, cast: number) =>
    ({
      system: { memorized, cast },
      update: vi.fn(),
    }) as unknown as OseSpell & {
      update: ReturnType<typeof vi.fn>;
    };

  it("writes the cast count", () => {
    const s = spellWith(3, 1);
    void setCasts(s, 2);
    expect(s.update).toHaveBeenCalledWith({ "system.cast": 2 });
  });

  it("clamps to 0..memorized", () => {
    const s = spellWith(2, 0);
    void setCasts(s, 5);
    expect(s.update).toHaveBeenCalledWith({ "system.cast": 2 });
    void setCasts(s, -1);
    expect(s.update).toHaveBeenCalledWith({ "system.cast": 0 });
  });

  it("keeps an over-memorized cast count reachable", () => {
    const s = spellWith(1, 3);
    void setCasts(s, 3);
    expect(s.update).toHaveBeenCalledWith({ "system.cast": 3 });
  });
});

describe("setPointsLeftAt", () => {
  const flagActor = (spellPoints?: Record<number, number>) =>
    ({
      ...(spellPoints ? { flags: { [MODULE_ID]: { spellPoints } } } : {}),
      setFlag: vi.fn(),
    }) as unknown as OSEActor & { setFlag: ReturnType<typeof vi.fn> };

  it("stores used = max - left, preserving other levels", () => {
    const actor = flagActor({ 2: 1 });
    void setPointsLeftAt(actor, 1, 1, 3);
    expect(actor.setFlag).toHaveBeenCalledWith(MODULE_ID, "spellPoints", {
      2: 1,
      1: 2,
    });
  });

  it("clamps the remaining count into 0..max", () => {
    const actor = flagActor();
    void setPointsLeftAt(actor, 1, 9, 3);
    expect(actor.setFlag).toHaveBeenCalledWith(MODULE_ID, "spellPoints", {
      1: 0,
    });
    void setPointsLeftAt(actor, 1, -2, 3);
    expect(actor.setFlag).toHaveBeenCalledWith(MODULE_ID, "spellPoints", {
      1: 3,
    });
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
    expect(selectFavoriteSpells(actor).map((s) => s.name)).toEqual([
      "Shield",
      "Web",
    ]);
  });
});

describe("createSpell", () => {
  const defaultName = vi.fn(({ type }: { type: string }) => `New ${type}`);

  beforeEach(() => {
    (globalThis as { Item?: unknown }).Item = {
      implementation: { defaultName },
    };
  });
  afterEach(() => {
    delete (globalThis as { Item?: unknown }).Item;
    vi.restoreAllMocks();
  });

  it("creates a spell item and opens its sheet", async () => {
    const render = vi.fn();
    const actor = {
      createEmbeddedDocuments: vi
        .fn()
        .mockResolvedValue([{ sheet: { render } }]),
    } as unknown as OSEActor & {
      createEmbeddedDocuments: ReturnType<typeof vi.fn>;
    };

    await createSpell(actor);

    expect(actor.createEmbeddedDocuments).toHaveBeenCalledWith("Item", [
      { type: "spell", name: "New spell" },
    ]);
    expect(render).toHaveBeenCalledWith(true);
  });
});
