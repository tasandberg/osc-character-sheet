import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { selectTopbar } from "@domain/topbar";
import { raistlin } from "@src/OscSheet/__fixtures__/raistlin";

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

describe("selectTopbar", () => {
  it("exposes level, next level, and xp progress", () => {
    const vm = selectTopbar(raistlin);
    expect(vm.level).toBe(3);
    expect(vm.nextLevel).toBe(4);
    expect(vm.xp).toEqual({ value: 6420, next: 10000 });
  });

  it("computes progress across the current level's band, not from zero", () => {
    // L3 floor 5000 → next 10000; (6420-5000)/(10000-5000) = 28.4%
    expect(selectTopbar(raistlin).pct).toBeCloseTo(28.4, 1);
  });
});
