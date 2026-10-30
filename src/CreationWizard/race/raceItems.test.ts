import { describe, it, expect } from "vitest";
import { raceStanding } from "./raceDraft";
import { raceFromItem } from "./raceItems";

const dwarf = {
  name: "Dwarf",
  system: {
    key: "dwarf",
    description: "<p>Stout folk.</p>",
    requirements: { con: { min: 9, max: null }, cha: { min: null, max: 17 } },
    languages: ["Common", "Dwarvish"],
    classLimits: [{ classKey: "fighter", maxLevel: 10 }],
    abilities: [{ uuid: "Compendium.abilities.infravision", level: 1 }],
  },
};

describe("raceFromItem", () => {
  it("reads modifiers from the race's ability-modifier effect on Foundry 14", () => {
    const race = raceFromItem(
      "Item.dwarf",
      {
        ...dwarf,
        effects: [
          { name: "Tweaks", system: { changes: [] } },
          {
            flags: { ose: { raceModifiers: true } },
            system: {
              changes: [
                { key: "system.scores.con.value", type: "add", value: 1 },
                { key: "system.scores.cha.value", type: "add", value: -1 },
                { key: "system.hp.hd", type: "override", value: "1d8" },
              ],
            },
          },
        ],
      },
      "ose",
    );
    expect(race).toMatchObject({
      name: "Dwarf",
      key: "dwarf",
      requirements: { con: { min: 9, max: null }, cha: { min: null, max: 17 } },
      modifiers: { con: 1, cha: -1 },
      classLimits: [{ classKey: "fighter", maxLevel: 10 }],
      languages: ["Common", "Dwarvish"],
    });
  });

  it("reads modifiers stored in the Foundry 13 shape", () => {
    const race = raceFromItem(
      "Item.dwarf",
      {
        ...dwarf,
        effects: [
          {
            flags: { ose: { raceModifiers: true } },
            changes: [
              { key: "system.scores.con.value", mode: 2, value: "1" },
              { key: "system.scores.str.value", mode: 5, value: "18" },
            ],
          },
        ],
      },
      "ose",
    );
    expect(race.modifiers).toEqual({ con: 1 });
  });
});

describe("raceStanding", () => {
  const race = raceFromItem("Item.dwarf", dwarf, "ose");

  it("checks minimum and maximum score requirements against rolled scores", () => {
    expect(raceStanding(race, { con: 9, cha: 18 })).toEqual({
      status: "failed",
      note: "CHA ≤17",
    });
    expect(raceStanding(race, { con: 9 })).toEqual({
      status: "pending",
      note: "CHA ≤17",
    });
    expect(raceStanding(race, { con: 9, cha: 17 }).status).toBe("open");
  });
});
