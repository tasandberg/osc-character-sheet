import { afterEach, describe, expect, it, vi } from "vitest";
import { ClassItems, type ClassItemDoc } from "../class/classItems";
import { createCharacter } from "./foundryCreate";
import type { NewCharacter } from "./newCharacter";

type Source = Record<string, unknown>;

const ability = (uuid: string, name: string, extra: Source = {}) => ({
  uuid,
  name,
  type: "ability",
  pack: "classicfantasycompendium.abilities",
  system: { requirements: "", ...extra },
  toObject: () => ({ name, type: "ability", system: { ...extra } }),
});

const abilities: Record<string, ReturnType<typeof ability>> = {
  "Compendium.cf.abilities.Item.backstab": ability(
    "Compendium.cf.abilities.Item.backstab",
    "Back-stab",
    { targetFrom: "skills" },
  ),
  "Compendium.cf.abilities.Item.read": ability(
    "Compendium.cf.abilities.Item.read",
    "Read Languages",
  ),
  "Compendium.cf.abilities.Item.infra": ability(
    "Compendium.cf.abilities.Item.infra",
    "Infravision",
  ),
  "Compendium.aft.abilities.Item.infra": ability(
    "Compendium.aft.abilities.Item.infra",
    "Infravision",
  ),
};

const thiefSystem = {
    key: "thief",
    description: "",
    requirements: "",
    primeReqs: [],
    maxLevel: 14,
    hitDie: "1d4",
    languages: [],
    levels: [],
    tables: [],
    abilities: [
      { uuid: "Compendium.cf.abilities.Item.backstab", level: 1 },
      { uuid: "Compendium.cf.abilities.Item.infra", level: 1 },
      { uuid: "Compendium.cf.abilities.Item.read", level: 4 },
    ],
    armourText: "",
    weaponsText: "",
    demihuman: false,
};

const thief: ClassItemDoc = {
  uuid: "Compendium.cf.classes.Item.thief",
  name: "Thief",
  type: "class",
  pack: "classicfantasycompendium.classes",
  system: thiefSystem,
  toObject: () => ({ name: "Thief", type: "class", system: thiefSystem }),
};

const dwarf: Source = {
  name: "Dwarf",
  type: "race",
  system: {
    key: "dwarf",
    abilities: [
      { uuid: "Compendium.aft.abilities.Item.infra", level: 1 },
      { uuid: "Compendium.cf.abilities.Item.read", level: 3 },
    ],
  },
};

const character: NewCharacter = {
  name: "Brom",
  class: { uuid: thief.uuid, level: 2, xp: 1200 },
  system: {},
  race: {
    uuid: "Compendium.aft.races.Item.dwarf",
    name: "Dwarf",
    key: "dwarf",
    description: "",
    requirements: {},
    modifiers: {},
    classLimits: [],
    languages: [],
    abilities: [],
    source: dwarf,
  },
  gear: [],
  gold: 0,
};

afterEach(() => vi.unstubAllGlobals());

describe("createCharacter", () => {
  it("creates the character with its class and race abilities without prompting", async () => {
    const created: { items: Source[] }[] = [];
    const offerAbilities = vi.fn();
    vi.stubGlobal("game", {
      system: { id: "ose" },
      packs: { get: () => undefined },
      items: {
        fromCompendium: (doc: { uuid: string; toObject(): Source }) => ({
          ...doc.toObject(),
          _stats: { compendiumSource: doc.uuid },
        }),
      },
    });
    vi.stubGlobal("fromUuid", async (uuid: string) => abilities[uuid] ?? null);
    vi.stubGlobal("foundry", {
      utils: {
        mergeObject: (a: Source, b: Source) => ({ ...a, ...b }),
        expandObject: (o: Source) => o,
        setProperty: () => true,
      },
    });
    vi.stubGlobal("CONFIG", {
      Actor: {
        documentClass: {
          create: async (data: { items: Source[] }) => {
            created.push(data);
            return { items: data.items, offerAbilities, sheet: null };
          },
        },
      },
    });
    vi.stubGlobal("ui", { notifications: { error: vi.fn() } });

    const ok = await createCharacter(new ClassItems([thief]))(character);

    expect(ok).toBe(true);
    expect(
      created[0].items.map((i) => [i.name, i.flags ?? null]),
    ).toEqual([
      ["Thief", null],
      [
        "Back-stab",
        {
          ose: {
            grantedBy: { type: "class", key: "thief" },
            classTarget: { classKey: "thief", target: "skills" },
          },
        },
      ],
      ["Infravision", { ose: { grantedBy: { type: "class", key: "thief" } } }],
      ["Dwarf", null],
    ]);
    expect(offerAbilities).not.toHaveBeenCalled();
  });
});
