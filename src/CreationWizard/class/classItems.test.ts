import { describe, expect, it } from "vitest";
import { creationClassFrom, type ClassItemDoc } from "./classItems";

const row = (xp: number, spellSlots: Record<string, number> = {}) => ({
  xp,
  hd: "1d6",
  hdcon: true,
  thac0: 19,
  bba: 0,
  saves: { death: 13, wand: 14, paralysis: 13, breath: 16, spell: 15 },
  spellSlots,
});

const halfling: ClassItemDoc = {
  uuid: "Compendium.classicfantasycompendium.classes.Item.abc",
  name: "Halfling",
  type: "class",
  system: {
    key: "halfling",
    description: "<p>Small folk.</p>",
    requirements: "Minimum CON 9, minimum DEX 9",
    primeReqs: [
      { ability: "dex" },
      { ability: "str" },
      { ability: "dex" },
      { ability: "str" },
    ],
    maxLevel: 8,
    hitDie: "1d6",
    languages: ["Alignment", "Common", "Halfling"],
    levels: [row(0), row(2000), row(4000, { "1": 1 })],
    tables: [],
    abilities: [],
    armourText: "Any appropriate to size",
    weaponsText: "",
    demihuman: true,
  },
  toObject: () => ({}),
};

describe("creationClassFrom", () => {
  it("reads requirements, prime requisites and progression from the class item", () => {
    expect(creationClassFrom(halfling)).toEqual({
      uuid: halfling.uuid,
      key: "halfling",
      name: "Halfling",
      requirements: { con: 9, dex: 9 },
      primeRequisites: ["dex", "str"],
      hitDie: "1d6",
      maxLevel: 3,
      languages: ["Alignment", "Common", "Halfling"],
      demihuman: true,
      casts: true,
      armour: "Any appropriate to size",
      weapons: undefined,
      tables: [],
    });
  });
});
