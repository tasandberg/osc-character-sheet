import { describe, expect, it } from "vitest";
import type { ClassStats, CreationClass } from "../rules";
import { characterDetails, detailsBlockedReason } from "./detailsDraft";

const fighter = { name: "Fighter", maxLevel: 14 } as CreationClass;
const stats = { hd: "1d8", conLevels: 1 } as ClassStats;

const input = (hitPoints?: { value: string; formula: string }) => ({
  draft: { name: "Brom", alignment: "lawful" as const, level: 1, hitPoints },
  cls: fighter,
  conMod: 0,
  maximum: () => 8,
  statsAt: () => stats,
});

describe("characterDetails under the 1st-level maximum rule", () => {
  it("starts with maximum hit points", () => {
    expect(characterDetails(input()).hitPoints?.value).toBe("8");
  });

  it("leaves a cleared value empty and asks for hit points", () => {
    const { draft, ...rest } = input({ value: "", formula: "max(1d8 + 0, 1)" });
    const details = characterDetails({ draft, ...rest });

    expect(details.hitPoints?.value).toBe("");
    expect(detailsBlockedReason(draft, details)).toBe(
      "Enter hit points to continue",
    );
  });
});
