import { describe, it, expect } from "vitest";
import { adjustedScores, raceSaveBonus, RACES } from "./raceDraft";

const race = (name: string) => RACES.find((r) => r.name === name)!;

describe("race rules", () => {
  it("keeps race-adjusted scores within 3 to 18", () => {
    expect(
      adjustedScores({ str: 18, con: 12, cha: 4 }, race("Half-Orc")),
    ).toEqual({ str: 18, con: 13, cha: 3 });
  });

  it("scales Resilience with CON", () => {
    const bonus = (con: number) => raceSaveBonus(race("Dwarf"), { con })?.bonus;
    expect([6, 7, 10, 11, 14, 15, 17, 18].map(bonus)).toEqual([
      0, 2, 2, 3, 3, 4, 4, 5,
    ]);
  });
});
