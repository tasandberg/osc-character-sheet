import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { scoreFormulaError } from "./scoreFormula";

const FORMULA = /^(\d+)d(\d+)(dl)?(?:\+(\d+))?$/;

class StubRoll {
  static validate = (formula: string) => FORMULA.test(formula);
  dice: { number: number; faces: number; results: { result: number }[] }[];
  total = 0;
  #dropLowest: boolean;
  #bonus: number;
  constructor(formula: string) {
    const [, number, faces, drop, bonus] = FORMULA.exec(formula)!;
    this.dice = [{ number: Number(number), faces: Number(faces), results: [] }];
    this.#dropLowest = !!drop;
    this.#bonus = Number(bonus ?? 0);
  }
  async evaluate() {
    const kept = this.dice[0].results
      .map((r) => r.result)
      .sort((a, b) => a - b)
      .slice(this.#dropLowest ? 1 : 0);
    this.total = kept.reduce((sum, value) => sum + value, this.#bonus);
    return this;
  }
}

beforeEach(() => vi.stubGlobal("Roll", StubRoll));
afterEach(() => vi.unstubAllGlobals());

describe("scoreFormulaError", () => {
  it("accepts formulas whose every result is a legal score", async () => {
    expect(await scoreFormulaError("3d6")).toBeUndefined();
    expect(await scoreFormulaError("4d6dl")).toBeUndefined();
    expect(await scoreFormulaError("2d6+6")).toBeUndefined();
  });

  it("rejects formulas that can roll outside 3 to 18, naming the range", async () => {
    expect(await scoreFormulaError("5d6")).toContain("5 to 30");
    expect(await scoreFormulaError("2d6")).toContain("2 to 12");
  });

  it("rejects text that isn't a roll formula", async () => {
    expect(await scoreFormulaError("lots of dice")).toContain("roll formula");
    expect(await scoreFormulaError("")).toContain("roll formula");
  });
});
