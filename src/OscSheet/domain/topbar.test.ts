import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { selectTopbar } from "@domain/topbar";
import { raistlin } from "@src/OscSheet/__fixtures__/raistlin";
import { classItem, levelRow } from "@src/OscSheet/__fixtures__/classItem";

// Magic-User XP table (floors per level) so the floor-relative progress resolves.
const MAGIC_USER = {
  name: "Magic-User",
  levels: [
    { xp: 0, hd: "1d4", saves: [13, 14, 13, 16, 15] },
    { xp: 2500, hd: "2d4", saves: [13, 14, 13, 16, 14] },
    { xp: 5000, hd: "3d4", saves: [13, 14, 13, 16, 14] },
    { xp: 10000, hd: "4d4", saves: [11, 12, 11, 14, 12] },
  ],
};

beforeEach(() => {
  (globalThis as unknown as { CONFIG: unknown }).CONFIG = {
    OSE: { classes: { classic: { "Magic-User": MAGIC_USER } } },
  };
});
afterEach(() => {
  delete (globalThis as unknown as { CONFIG?: unknown }).CONFIG;
});

const atLevel = (level: number, next: number) =>
  ({
    ...raistlin,
    system: {
      ...raistlin.system,
      details: {
        ...raistlin.system.details,
        level,
        xp: { ...raistlin.system.details.xp, next },
      },
    },
  }) as typeof raistlin;

describe("selectTopbar", () => {
  it("exposes level, next level, and xp progress", () => {
    const vm = selectTopbar(raistlin);
    expect(vm.level).toBe(3);
    expect(vm.nextLevel).toBe(4);
    expect(vm.xp).toEqual({ value: 6420, floor: 5000, next: 10000 });
  });

  it("computes progress across the current level's band, not from zero", () => {
    // L3 floor 5000 → next 10000; (6420-5000)/(10000-5000) = 28.4%
    expect(selectTopbar(raistlin).pct).toBeCloseTo(28.4, 1);
  });

  it("reports the class table floor even when the level outruns the earned XP", () => {
    // L4 floor 10000 with only 6420 earned: the floor still reads from the
    // table, and the bar empties rather than filling from zero.
    const vm = selectTopbar(atLevel(4, 20000));
    expect(vm.xp.floor).toBe(10000);
    expect(vm.pct).toBe(0);
  });

  it("reads the XP band from the class item, ending it at the table's last level", () => {
    const mage = classItem("Magic-User", 2, 2600, [
      levelRow(0, "1d4", 19, [13, 14, 13, 16, 15]),
      levelRow(2500, "2d4", 19, [13, 14, 13, 16, 14]),
    ]);
    const actor = {
      ...raistlin,
      system: {
        ...raistlin.system,
        classes: [mage],
        details: {
          ...raistlin.system.details,
          class: "Magic-User / Necromancer",
          level: 2,
          xp: { ...raistlin.system.details.xp, value: 2600, next: 2600 },
        },
      },
    } as typeof raistlin;
    const vm = selectTopbar(actor);
    expect(vm.nextLevel).toBeNull();
    expect(vm.xp).toEqual({ value: 2600, floor: 2500, next: null });
  });

  it("falls back to a zero floor past the end of the class table", () => {
    const vm = selectTopbar(atLevel(9, 20000));
    expect(vm.xp.floor).toBe(0);
    expect(vm.pct).toBeCloseTo(32.1, 1);
  });
});
