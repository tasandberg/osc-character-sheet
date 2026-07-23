import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  selectClassDefaults,
  normalizeClassName,
  classSource,
} from "@domain/classRules";
import type { OSEActor } from "@domain/types";

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
