import { afterEach, describe, expect, it, vi } from "vitest";
import { ClassItems, type ClassItemDoc } from "../class/classItems";
import { createCharacter } from "./foundryCreate";
import type { NewCharacter } from "./newCharacter";

type Source = Record<string, unknown>;

const thiefSystem = {
  key: "thief",
  description: "",
  requirements: {},
  primeReqs: [],
  maxLevel: 14,
  hitDie: "1d4",
  languages: ["Alignment", "Common"],
  levels: [],
  tables: [],
  abilities: [{ uuid: "Compendium.cf.abilities.Item.backstab", level: 1 }],
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

const dwarf: Source = { name: "Dwarf", type: "race", system: { key: "dwarf" } };

const character: NewCharacter = {
  name: "Brom",
  class: { uuid: thief.uuid, level: 2, xp: 1200 },
  system: { details: { alignment: "Lawful" } },
  race: {
    uuid: "Compendium.aft.races.Item.dwarf",
    name: "Dwarf",
    key: "dwarf",
    description: "",
    requirements: {},
    modifiers: {},
    classLimits: [],
    languages: [],
    infravision: 60,
    saveBonuses: [],
    abilities: [],
    source: dwarf,
  },
  gear: [],
  gold: 0,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createCharacter", () => {
  it("adds the class at its level and the race, granting their abilities without a prompt", async () => {
    const calls: unknown[] = [];
    const actor = {
      items: [] as Source[],
      sheet: null,
      addClass: vi.fn(async (data: Source, options: object) => {
        calls.push(["addClass", (data as { name: string }).name, options]);
        return { type: "class", name: "Thief" };
      }),
      setRace: vi.fn(async (data: Source, options: object) => {
        calls.push(["setRace", (data as { name: string }).name, options]);
        return { type: "race", name: "Dwarf" };
      }),
      offerAbilities: vi.fn(async (item: { name: string }, level: number, options: object) => {
        calls.push(["offerAbilities", item.name, level, options]);
      }),
    };
    vi.stubGlobal("game", {
      system: { id: "ose" },
      packs: { get: () => undefined },
      items: { fromCompendium: (doc: { toObject(): Source }) => doc.toObject() },
    });
    vi.stubGlobal("foundry", {
      utils: { expandObject: (o: Source) => o, setProperty: () => true },
    });
    vi.stubGlobal("CONFIG", {
      Actor: { documentClass: { create: async () => actor } },
    });
    vi.stubGlobal("ui", { notifications: { error: vi.fn() } });

    const ok = await createCharacter(new ClassItems([thief]))(character);

    expect(ok).toBe(true);
    expect(calls).toEqual([
      ["setRace", "Dwarf", { modifiersIncluded: false }],
      ["addClass", "Thief", { level: 2, rollHp: false }],
      ["offerAbilities", "Thief", 2, { upTo: true, confirm: false }],
      ["offerAbilities", "Dwarf", 1, { upTo: true, confirm: false }],
    ]);
  });

  it("leaves no actor behind when a new character can't be finished", async () => {
    const world: object[] = [];
    const actor = {
      items: [] as Source[],
      sheet: null,
      setRace: async () => undefined,
      addClass: async () => {
        throw new Error("no such class");
      },
      delete: async () => {
        world.splice(world.indexOf(actor), 1);
      },
    };
    const notifyError = vi.fn();
    vi.stubGlobal("game", {
      system: { id: "ose" },
      packs: { get: () => undefined },
      items: { fromCompendium: (doc: { toObject(): Source }) => doc.toObject() },
    });
    vi.stubGlobal("foundry", {
      utils: { expandObject: (o: Source) => o, setProperty: () => true },
    });
    vi.stubGlobal("CONFIG", {
      Actor: {
        documentClass: {
          create: async () => {
            world.push(actor);
            return actor;
          },
        },
      },
    });
    vi.stubGlobal("ui", { notifications: { error: notifyError } });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const ok = await createCharacter(new ClassItems([thief]))(character);

    expect(ok).toBe(false);
    expect(world).toEqual([]);
    expect(notifyError).toHaveBeenCalledWith(
      "Couldn’t create Brom: no such class",
    );
  });
});
