import { describe, expect, it } from "vitest";
import {
  classRequirementGaps,
  isNpcOnly,
  racialAbilityValue,
  raceSaveBonus,
} from "./upstreamGaps";

describe("upstream gaps", () => {
  it("fills in what the OSE items lack for a dwarf", () => {
    const dwarf = { key: "dwarf", name: "Dwarf" };
    expect(isNpcOnly(dwarf, { key: "cleric", name: "Cleric" })).toBe(true);
    expect(isNpcOnly(dwarf, { key: "thief", name: "Thief" })).toBe(false);
    expect(racialAbilityValue(dwarf, "Infravision", {})).toBe("60′");
    expect(raceSaveBonus(dwarf, { con: 12 })).toEqual({
      bonus: 3,
      summary: "+3 vs poison, spells, wands",
      basis: "Resilience, CON 12",
    });
    expect(raceSaveBonus(dwarf, {})).toBeUndefined();
    expect(classRequirementGaps({ key: "", name: "Dwarf" })).toEqual({
      con: 9,
    });
  });

  it("leaves unknown races and classes alone", () => {
    const human = { key: "human", name: "Human" };
    expect(isNpcOnly(human, { key: "cleric", name: "Cleric" })).toBe(false);
    expect(raceSaveBonus(human, { con: 18 })).toBeUndefined();
    expect(racialAbilityValue(human, "Infravision", {})).toBeUndefined();
    expect(classRequirementGaps({ key: "fighter", name: "Fighter" })).toEqual(
      {},
    );
  });
});
