import { describe, it, expect } from "vitest";
import { houseRules } from "./houseRuleSettings";
import type { ScoreMethod } from "./scores/scoresDraft";

describe("houseRules", () => {
  it("names the world's armour class and encumbrance rules", () => {
    expect(
      houseRules({ ascendingAC: false, encumbranceOption: "detailed" }).map(
        (r) => r.tag,
      ),
    ).toEqual(["Descending AC", "Detailed encumbrance"]);
    expect(
      houseRules({ ascendingAC: true, encumbranceOption: "complete" }).map(
        (r) => r.tag,
      ),
    ).toEqual(["Ascending AC", "Complete encumbrance"]);
  });

  it("names the race rule only when the world has races to apply it to", () => {
    expect(
      houseRules({
        ascendingAC: false,
        encumbranceOption: "basic",
        raceMode: "asClass",
      }).map((r) => r.tag),
    ).toEqual(["Descending AC", "Basic encumbrance", "Race as class"]);
  });

  it("names the score methods only when the referee has turned one off", () => {
    const tags = (scoreMethods: ScoreMethod[]) =>
      houseRules({
        ascendingAC: false,
        encumbranceOption: "basic",
        scoreMethods,
      })
        .map((r) => r.tag)
        .slice(2);
    expect(tags(["inOrder", "arrange", "manual"])).toEqual([]);
    expect(tags(["inOrder", "arrange"])).toEqual(["No manual scores"]);
    expect(tags(["inOrder"])).toEqual(["3d6 in order only"]);
  });
});
