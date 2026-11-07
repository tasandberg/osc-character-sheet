import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  selectClassDefaults,
  selectProgression,
  selectSpellSlotDefaults,
  normalizeClassName,
  classSource,
} from "@domain/classRules";
import type { OSEActor, OseClassItem } from "@domain/types";
import { classItem, levelRow } from "@src/OscSheet/__fixtures__/classItem";

const FIGHTER = {
  name: "Fighter",
  abilitiesPack: "x",
  requirements: {},
  source: "Classic Fantasy",
  levels: [
    { xp: 0, hd: "1d8", thac0: 19, saves: [12, 13, 14, 15, 16] },
    { xp: 2000, hd: "2d8", thac0: 17, saves: [11, 12, 13, 14, 15] },
  ],
};

const MAGIC_USER = {
  name: "Magic-User",
  abilitiesPack: "x",
  requirements: {},
  source: "Classic Fantasy",
  levels: [
    { xp: 0, hd: "1d4", thac0: 19, saves: [13, 14, 13, 16, 15] },
    { xp: 2500, hd: "2d4", thac0: 19, saves: [13, 14, 13, 16, 14] },
  ],
};

beforeEach(() => {
  (globalThis as unknown as { CONFIG: unknown }).CONFIG = {
    OSE: {
      classes: { classic: { Fighter: FIGHTER, "Magic-User": MAGIC_USER } },
    },
  };
});
afterEach(() => {
  delete (globalThis as unknown as { CONFIG?: unknown }).CONFIG;
});

const actorAt = (cls: string, level: number) =>
  ({ system: { details: { class: cls, level } } }) as unknown as OSEActor;

const withClassItems = (cls: string, classes: OseClassItem[]) =>
  ({
    system: { details: { class: cls, level: 1 }, classes },
  }) as unknown as OSEActor;

const FIGHTER_ITEM_LEVELS = [
  levelRow(0, "1d8", 19, [12, 13, 14, 15, 16]),
  levelRow(2000, "2d8", 17, [11, 12, 14, 14, 15]),
];
const THIEF_ITEM_LEVELS = [
  levelRow(0, "1d4", 19, [13, 14, 13, 16, 15]),
  levelRow(1200, "2d4", 19, [12, 14, 13, 16, 14]),
];
const CLERIC_ITEM_LEVELS = [
  levelRow(0, "1d6", 19, [11, 12, 14, 16, 15]),
  levelRow(1500, "2d6", 19, [11, 12, 14, 16, 15], { 1: 1 }),
];
const MAGE_ITEM_LEVELS = [
  levelRow(0, "1d4", 19, [13, 14, 13, 16, 15], { 1: 1 }),
  levelRow(2500, "2d4", 19, [13, 14, 13, 16, 15], { 1: 2 }),
];

describe("selectProgression", () => {
  it("reads progression from class items when the character has them", () => {
    const fighter = classItem("Fighter", 1, 0, FIGHTER_ITEM_LEVELS);
    const p = selectProgression(withClassItems("Fighter", [fighter]));
    expect(p.source).toBe("item");
    expect(p.classes).toEqual([fighter]);
  });
  it("falls back to CONFIG for a class name it lists", () => {
    expect(selectProgression(actorAt("magic user", 1)).source).toBe("config");
  });
  it("is custom when neither class items nor CONFIG describe the class", () => {
    expect(selectProgression(actorAt("Hangman", 1)).source).toBe("custom");
  });
});

describe("selectClassDefaults — class items", () => {
  it("takes the best of each class's row for a multi-class character", () => {
    const d = selectClassDefaults(
      withClassItems("Fighter / Thief", [
        classItem("Fighter", 2, 2100, FIGHTER_ITEM_LEVELS),
        classItem("Thief", 1, 1100, THIEF_ITEM_LEVELS),
      ]),
    );
    expect(d.matched).toBe(true);
    expect(d.hd).toBe("2d8 / 1d4");
    expect(d.thac0).toBe(17);
    expect(d.saves).toEqual({
      death: 11,
      wand: 12,
      paralysis: 13,
      breath: 14,
      spell: 15,
    });
  });
  it("reads the XP band from the first class's table", () => {
    const d = selectClassDefaults(
      withClassItems("Thief / Fighter", [
        classItem("Thief", 1, 600, THIEF_ITEM_LEVELS),
        classItem("Fighter", 1, 600, FIGHTER_ITEM_LEVELS),
      ]),
    );
    expect(d.levelXp).toBe(0);
    expect(d.nextXp).toBe(1200);
  });
  it("ignores CONFIG for a class item whose name CONFIG also lists", () => {
    const d = selectClassDefaults(
      withClassItems("Fighter", [classItem("Fighter", 1, 0, [])]),
    );
    expect(d.matched).toBe(false);
    expect(d.nextXp).toBeNull();
  });
});

describe("selectSpellSlotDefaults", () => {
  it("totals each casting class's slots", () => {
    const actor = withClassItems("Cleric / Magic-User", [
      classItem("Cleric", 2, 1500, CLERIC_ITEM_LEVELS),
      classItem("Magic-User", 2, 2500, MAGE_ITEM_LEVELS),
    ]);
    expect(selectSpellSlotDefaults(actor)).toEqual({ 1: 3 });
  });
});

describe("normalizeClassName", () => {
  it("matches case-insensitively", () => {
    expect(normalizeClassName("fighter")).toBe("Fighter");
  });
  it("returns null for unknown classes", () => {
    expect(normalizeClassName("Bard")).toBeNull();
  });
  it("matches 'Magic User' (space) to 'Magic-User' (hyphen key)", () => {
    expect(normalizeClassName("Magic User")).toBe("Magic-User");
  });
  it("matches 'magic-user' (lowercase hyphen) to 'Magic-User'", () => {
    expect(normalizeClassName("magic-user")).toBe("Magic-User");
  });
});

describe("selectClassDefaults", () => {
  it("derives hd, saves, nextXp for a known class+level", () => {
    const d = selectClassDefaults(actorAt("Fighter", 1));
    expect(d.matched).toBe(true);
    expect(d.maxLevel).toBe(2);
    expect(d.hd).toBe("1d8");
    expect(d.nextXp).toBe(2000);
    expect(d.thac0).toBe(19);
    expect(d.saves).toEqual({
      death: 12,
      wand: 13,
      paralysis: 14,
      breath: 15,
      spell: 16,
    });
  });
  it("returns null nextXp at max level", () => {
    expect(selectClassDefaults(actorAt("Fighter", 2)).nextXp).toBeNull();
  });
  it("derives the per-level thac0 (L2 differs from L1)", () => {
    expect(selectClassDefaults(actorAt("Fighter", 2)).thac0).toBe(17);
  });
  it("returns matched=false and null tables for unknown classes", () => {
    const d = selectClassDefaults(actorAt("Bard", 3));
    expect(d.matched).toBe(false);
    expect(d.hd).toBeNull();
    expect(d.saves).toBeNull();
    expect(d.thac0).toBeNull();
    expect(d.maxLevel).toBe(14);
  });
  it("resolves Magic User (space in actor) to Magic-User config entry", () => {
    const d = selectClassDefaults(actorAt("Magic User", 1));
    expect(d.matched).toBe(true);
    expect(d.hd).toBe("1d4");
    expect(d.nextXp).toBe(2500);
    expect(d.saves).toEqual({
      death: 13,
      wand: 14,
      paralysis: 13,
      breath: 16,
      spell: 15,
    });
  });
});

describe("selectClassDefaults — advanced classes", () => {
  const BARD = {
    name: "Bard",
    requirements: { cha: 13, dex: 9 },
    levels: [
      { xp: 0, hd: "1d6", thac0: 19, saves: [13, 14, 13, 16, 15] },
      { xp: 1500, hd: "2d6", thac0: 19, saves: [13, 14, 13, 16, 14] },
    ],
  };
  // Advanced Fighter with a different XP table than the classic FIGHTER above.
  const ADV_FIGHTER = {
    name: "Fighter",
    levels: [
      { xp: 0, hd: "1d8", thac0: 19, saves: [12, 13, 14, 15, 16] },
      { xp: 2200, hd: "2d8", thac0: 16, saves: [10, 11, 12, 13, 14] },
    ],
  };

  beforeEach(() => {
    (globalThis as unknown as { CONFIG: unknown }).CONFIG = {
      OSE: {
        classes: {
          classic: { Fighter: FIGHTER, "Magic-User": MAGIC_USER },
          advanced: { Bard: BARD, Fighter: ADV_FIGHTER },
        },
      },
    };
  });

  it("resolves an advanced-only class (Bard) from the advanced map", () => {
    const d = selectClassDefaults(actorAt("Bard", 1));
    expect(d.matched).toBe(true);
    expect(d.hd).toBe("1d6");
    expect(d.nextXp).toBe(1500);
    expect(d.requirements).toEqual({ cha: 13, dex: 9 });
  });
  it("prefers advanced data over classic for a same-named class", () => {
    // classic Fighter L1→L2 = 2000; advanced Fighter = 2200
    expect(selectClassDefaults(actorAt("Fighter", 1)).nextXp).toBe(2200);
    expect(selectClassDefaults(actorAt("Fighter", 2)).thac0).toBe(16);
    expect(normalizeClassName("Bard")).toBe("Bard");
  });
});

describe("classSource", () => {
  beforeEach(() => {
    (globalThis as unknown as { CONFIG: unknown }).CONFIG = {
      OSE: {
        classes: {
          classic: { Fighter: FIGHTER, "Magic-User": MAGIC_USER },
          advanced: { Bard: {}, Fighter: {} },
        },
      },
    };
  });

  it("classifies classic-only classes", () => {
    expect(classSource("Magic-User")).toBe("classic");
  });
  it("classifies advanced-only classes", () => {
    expect(classSource("Bard")).toBe("advanced");
  });
  it("classifies unknown classes as custom", () => {
    expect(classSource("Hangman")).toBe("custom");
    expect(classSource("")).toBe("custom");
  });
  it("canonicalizes before matching (case + hyphen/space)", () => {
    expect(classSource("magic user")).toBe("classic");
    expect(classSource("bard")).toBe("advanced");
  });
  it("prefers advanced over classic when a name is in both", () => {
    expect(classSource("Fighter")).toBe("advanced");
  });
  it("is custom when no CONFIG maps exist", () => {
    (globalThis as unknown as { CONFIG: unknown }).CONFIG = { OSE: {} };
    expect(classSource("Fighter")).toBe("custom");
  });
});
