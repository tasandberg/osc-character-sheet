import { afterEach, describe, expect, it, vi } from "vitest";
import {
  creationClassFrom,
  loadClassItems,
  type ClassItemDoc,
} from "./classItems";

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

const classDoc = (pack: string | null, name: string, key = name.toLowerCase()) =>
  ({
    uuid: `${pack ? `Compendium.${pack}.Item` : "Item"}.${name}`,
    name,
    type: "class",
    pack,
    system: { ...halfling.system, key },
    toObject: () => ({}),
  }) satisfies ClassItemDoc;

const itemPack = (id: string, docs: ClassItemDoc[]) => ({
  collection: id,
  documentName: "Item",
  getIndex: async () => docs.map((d) => ({ _id: d.uuid, type: "class" })),
  getDocuments: async () => docs,
});

afterEach(() => vi.unstubAllGlobals());

describe("loadClassItems", () => {
  it("prefers world classes, then Advanced Fantasy, over Classic Fantasy duplicates", async () => {
    const worldThief = classDoc(null, "Thief");
    const tomeCleric = classDoc("ose-advancedfantasytome.classes", "Cleric");
    const tomeThief = classDoc("ose-advancedfantasytome.classes", "Thief");
    const classicCleric = classDoc("classicfantasycompendium.classes", "Cleric");
    const classicFighter = classDoc("classicfantasycompendium.classes", "Fighter");
    vi.stubGlobal("game", {
      items: { filter: () => [worldThief] },
      packs: {
        contents: [
          itemPack("classicfantasycompendium.classes", [
            classicCleric,
            classicFighter,
          ]),
          itemPack("ose-advancedfantasytome.classes", [tomeCleric, tomeThief]),
        ],
      },
    });
    expect((await loadClassItems()).map((d) => d.uuid)).toEqual([
      tomeCleric.uuid,
      classicFighter.uuid,
      worldThief.uuid,
    ]);
  });
});
