import { describe, it, expect } from "vitest";
import { classRuleConstants } from "./classConstants";
import { formatXpModifier, xpAdjustment } from "./xpAdjustment";

const adjust = (name: string, scores: Record<string, number>) => {
  const xp = xpAdjustment(classRuleConstants(name)!, scores);
  return xp && `${formatXpModifier(xp.modifier)} from ${xp.basis}`;
};

describe("xpAdjustment", () => {
  it("scales a single prime requisite by the score bands", () => {
    expect([5, 8, 12, 13, 16].map((wis) => adjust("Cleric", { wis }))).toEqual([
      "−20% from WIS 5",
      "−10% from WIS 8",
      "±0% from WIS 12",
      "+5% from WIS 13",
      "+10% from WIS 16",
    ]);
  });

  it("applies a class's own rule for several prime requisites, without penalties", () => {
    expect(adjust("Half Elf", { int: 13, str: 16 })).toBe(
      "+10% from INT 13, STR 16",
    );
    expect(adjust("Half-Elf", { int: 13, str: 13 })).toBe(
      "+5% from INT 13, STR 13",
    );
    expect(adjust("Elf", { int: 4, str: 4 })).toBe("±0% from INT 4, STR 4");
    expect(adjust("Halfling", { dex: 13, str: 9 })).toBe(
      "+5% from DEX 13, STR 9",
    );
  });

  it("waits until every prime requisite is known", () => {
    expect(adjust("Elf", { int: 16 })).toBeUndefined();
  });
});
