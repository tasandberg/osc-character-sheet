import { describe, it, expect } from "vitest";
import {
  employerLoyaltyDefault,
  selectEmployerOptions,
  type EmployerCandidate,
} from "./employer";

const actor = (
  over: Partial<EmployerCandidate> & { id: string },
): EmployerCandidate => ({
  name: over.id,
  type: "character",
  hasPlayerOwner: true,
  ...over,
});

describe("selectEmployerOptions", () => {
  it("keeps only player-owned characters other than the retainer, sorted by name", () => {
    const options = selectEmployerOptions(
      [
        actor({ id: "self", name: "Hireling" }),
        actor({ id: "b", name: "Brother Odo" }),
        actor({ id: "npc", name: "Innkeeper", hasPlayerOwner: false }),
        actor({ id: "mon", name: "Goblin", type: "monster" }),
        actor({ id: "a", name: "Aldric" }),
      ],
      "self",
    );

    expect(options).toEqual([
      { id: "a", name: "Aldric" },
      { id: "b", name: "Brother Odo" },
    ]);
  });

  it("skips actors without an id", () => {
    expect(
      selectEmployerOptions([{ ...actor({ id: "x" }), id: null }], "self"),
    ).toEqual([]);
  });
});

describe("employerLoyaltyDefault", () => {
  it("reads the employer's OSE cha.loyalty getter", () => {
    const employer = actor({
      id: "a",
      name: "Aldric",
      system: { scores: { cha: { value: 16, loyalty: 9 } } },
    });

    expect(employerLoyaltyDefault(employer)).toEqual({
      loyalty: 9,
      cha: 16,
      employerName: "Aldric",
    });
  });

  it("is null without an employer or a derived loyalty", () => {
    expect(employerLoyaltyDefault(undefined)).toBeNull();
    expect(
      employerLoyaltyDefault(
        actor({ id: "a", system: { scores: { cha: { value: 12 } } } }),
      ),
    ).toBeNull();
  });
});
