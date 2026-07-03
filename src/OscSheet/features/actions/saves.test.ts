import { describe, it, expect } from "vitest";
import { selectSaves } from "@features/actions/saves";
import { raistlin } from "@src/OscSheet/__fixtures__/raistlin";

describe("selectSaves", () => {
  const vm = selectSaves(raistlin);

  it("returns the five saves in D/W/P/B/S order", () => {
    expect(vm.map((s) => s.key)).toEqual(["death", "wand", "paralysis", "breath", "spell"]);
  });

  it("reads the target value (handling the {value} runtime shape)", () => {
    expect(vm.map((s) => s.target)).toEqual([13, 14, 13, 16, 15]);
    expect(vm[0].label).toBe("Death");
  });
});
