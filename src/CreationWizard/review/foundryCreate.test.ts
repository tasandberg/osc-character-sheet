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

  it("refuses to overwrite an existing actor that is no longer blank", async () => {
    const sword = { id: "sword" };
    const existing = {
      type: "character",
      name: "New Actor",
      system: { scores: {} },
      items: [sword],
      deleteEmbeddedDocuments: async () => {
        existing.items.length = 0;
      },
    };
    const notifyError = vi.fn();
    vi.stubGlobal("game", {
      system: { id: "ose" },
      packs: { get: () => undefined },
    });
    vi.stubGlobal("ui", { notifications: { error: notifyError } });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const ok = await createCharacter(
      new ClassItems([thief]),
      existing as never,
    )(character);

    expect(ok).toBe(false);
    expect(existing.items).toEqual([sword]);
    expect(notifyError).toHaveBeenCalledWith(
      "Couldn’t create Brom: this character already has scores or items, so the wizard won’t overwrite it.",
    );
  });

  const blankActor = (grants: { addClass(): Promise<undefined> }) => {
    const actor = {
      id: "actor",
      type: "character",
      name: "New Actor",
      system: { scores: {} as Record<string, { value: number }> },
      items: [] as { id: string }[],
      sheet: null,
      update: async () => {
        actor.system.scores.str = { value: 12 };
      },
      deleteEmbeddedDocuments: async () => {
        actor.items.length = 0;
      },
      createEmbeddedDocuments: async () => {},
      setRace: async () => undefined,
      ...grants,
    };
    return actor;
  };

  const stubFill = (world: { id: string }[] = []) => {
    const notifyError = vi.fn();
    vi.stubGlobal("game", {
      system: { id: "ose" },
      items: { fromCompendium: (doc: { toObject(): Source }) => doc.toObject() },
      actors: { get: (id: string) => world.find((actor) => actor.id === id) },
    });
    vi.stubGlobal("foundry", { utils: { flattenObject: (o: Source) => o } });
    vi.stubGlobal("ui", { notifications: { error: notifyError } });
    vi.spyOn(console, "error").mockImplementation(() => {});
    return notifyError;
  };

  it("finishes an existing actor on a second try after the first stopped partway", async () => {
    stubFill();
    let attempts = 0;
    const existing = blankActor({
      addClass: async () => {
        if (!attempts++) throw new Error("no such class");
        return undefined;
      },
    });
    const create = createCharacter(new ClassItems([thief]), existing as never);

    expect(await create(character)).toBe(false);
    expect(await create(character)).toBe(true);
  });

  it("still refuses a filled-in actor when an earlier try wrote nothing to it", async () => {
    const notifyError = stubFill();
    const sword = { id: "sword" };
    const existing = blankActor({ addClass: async () => undefined });
    existing.update = async () => {
      throw new Error("connection lost");
    };
    const create = createCharacter(new ClassItems([thief]), existing as never);

    expect(await create(character)).toBe(false);
    existing.items.push(sword);
    expect(await create(character)).toBe(false);

    expect(existing.items).toEqual([sword]);
    expect(notifyError).toHaveBeenLastCalledWith(
      "Couldn’t create Brom: this character already has scores or items, so the wizard won’t overwrite it.",
    );
  });

  it("finishes the same actor on a second try when the player can't delete it", async () => {
    const world: { id: string }[] = [];
    stubFill(world);
    let attempts = 0;
    const actor = {
      ...blankActor({
        addClass: async () => {
          if (!attempts++) throw new Error("no such class");
          return undefined;
        },
      }),
      delete: async () => {
        throw new Error("lacks permission");
      },
    };
    vi.stubGlobal("foundry", {
      utils: {
        expandObject: (o: Source) => o,
        flattenObject: (o: Source) => o,
      },
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
    const create = createCharacter(new ClassItems([thief]));

    expect(await create(character)).toBe(false);
    expect(await create(character)).toBe(true);
    expect(world).toEqual([actor]);
  });

  it("keeps a finished character whose sheet fails to open", async () => {
    stubFill();
    const existing = {
      ...blankActor({ addClass: async () => undefined }),
      get sheet(): null {
        throw new Error("sheet unavailable");
      },
    };

    const ok = await createCharacter(
      new ClassItems([thief]),
      existing as never,
    )(character);

    expect(ok).toBe(true);
  });

  it("drops the first try's race languages when the retry has no race", async () => {
    stubFill();
    const languages: string[] = [];
    const existing = {
      ...blankActor({
        addClass: async () => {
          if (languages.length) throw new Error("no such class");
          return undefined;
        },
      }),
      update: async (data: Record<string, unknown>) => {
        existing.system.scores.str = { value: 12 };
        languages.splice(0, languages.length, ...(data["system.languages.value"] as string[]));
      },
      setRace: async () => {
        languages.push("Dwarvish");
        return undefined;
      },
    };
    const create = createCharacter(new ClassItems([thief]), existing as never);

    expect(await create(character)).toBe(false);
    expect(await create({ ...character, race: undefined })).toBe(true);
    expect(languages).toEqual([]);
  });

  it("creates a fresh actor when the one it couldn't delete has since been removed", async () => {
    const world: { id: string }[] = [];
    stubFill(world);
    const unfinished = {
      ...blankActor({
        addClass: async () => {
          throw new Error("no such class");
        },
      }),
      delete: async () => {
        throw new Error("lacks permission");
      },
    };
    const fresh = { ...blankActor({ addClass: async () => undefined }), id: "fresh" };
    const made = [unfinished, fresh];
    vi.stubGlobal("foundry", {
      utils: {
        expandObject: (o: Source) => o,
        flattenObject: (o: Source) => o,
      },
    });
    vi.stubGlobal("CONFIG", {
      Actor: {
        documentClass: {
          create: async () => {
            const actor = made.shift();
            if (actor) world.push(actor);
            return actor;
          },
        },
      },
    });
    const create = createCharacter(new ClassItems([thief]));

    expect(await create(character)).toBe(false);
    world.length = 0;
    expect(await create(character)).toBe(true);
    expect(world).toEqual([fresh]);
  });
});
