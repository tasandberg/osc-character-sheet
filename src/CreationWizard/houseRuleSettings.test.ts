import { describe, it, expect } from "vitest";
import { houseRules } from "./houseRuleSettings";

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
});
