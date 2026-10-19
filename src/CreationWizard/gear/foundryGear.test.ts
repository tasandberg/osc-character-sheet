import { afterEach, describe, expect, it, vi } from "vitest";
import { loadGearCatalog } from "./foundryGear";

type Entry = {
  name: string;
  type?: string;
  folder?: string;
  cost?: number;
  weight?: number | null;
  treasure?: boolean;
  damage?: string;
  qualities?: string[];
  armour?: { type: string; ac: number; aac: number };
};

const pack = (id: string, entries: Entry[], folders: string[] = []) => ({
  folders: { contents: folders.map((name) => ({ id: name, name })) },
  getDocuments: async () =>
    entries.map((e) => ({
      uuid: `Compendium.${id}.Item.${e.name}`,
      name: e.name,
      img: "icon.webp",
      type: e.type ?? "item",
      folder: e.folder ? { id: e.folder } : null,
      system: {
        cost: e.cost ?? 1,
        weight: e.weight,
        treasure: e.treasure,
        damage: e.damage,
        qualities: e.qualities?.map((label) => ({ label })),
        type: e.armour?.type,
        ac: { value: e.armour?.ac },
        aac: { value: e.armour?.aac },
      },
    })),
});

function stubFoundry(
  packs: Record<string, ReturnType<typeof pack>>,
  { tome = false, ascendingAC = false } = {},
) {
  vi.stubGlobal("game", {
    packs: { get: (id: string) => packs[id] },
    modules: { get: () => ({ active: tome }) },
    system: { id: "ose" },
    settings: {
      get: (_: string, key: string) => key === "ascendingAC" && ascendingAC,
    },
  });
  vi.stubGlobal("CONFIG", {
    OSE: { classes: { classic: {}, advanced: tome ? { elf: {} } : {} } },
  });
}

afterEach(() => vi.unstubAllGlobals());

const summary = (items: Awaited<ReturnType<typeof loadGearCatalog>>) =>
  items.map((i) =>
    [i.name, i.category, i.cost, i.weight, i.detail]
      .filter((v) => v !== undefined)
      .join(":"),
  );

describe("loadGearCatalog", () => {
  it("reads the Classic Fantasy equipment packs without coins", async () => {
    stubFoundry({
      "classicfantasycompendium.equipment-weapons": pack("w", [
        {
          name: "Sword",
          type: "weapon",
          cost: 10,
          weight: 60,
          damage: "1d8",
          qualities: ["Melee"],
        },
        {
          name: "Dagger",
          type: "weapon",
          cost: 3,
          weight: 10,
          damage: "1d4",
          qualities: ["Melee", "Missile"],
        },
      ]),
      "classicfantasycompendium.equipment-armour": pack("a", [
        {
          name: "Chainmail",
          type: "armor",
          cost: 40,
          weight: 400,
          armour: { type: "heavy", ac: 5, aac: 14 },
        },
        {
          name: "Shield",
          type: "armor",
          cost: 10,
          weight: 100,
          armour: { type: "shield", ac: 1, aac: 1 },
        },
      ]),
      "classicfantasycompendium.equipment-adventuring-gear": pack("g", [
        { name: "Rope", cost: 1, weight: null },
        { name: "Gold (gp)", treasure: true },
      ]),
      "classicfantasycompendium.equipment-ammunition": pack("m", [
        { name: "Arrows", cost: 5 },
      ]),
    });

    expect(summary(await loadGearCatalog())).toEqual([
      "Arrows:ammunition:5:0",
      "Chainmail:armour:40:400:AC 5 [14]",
      "Dagger:weapons:3:10:1d4",
      "Rope:gear:1:0",
      "Shield:armour:10:100:+1 AC",
      "Sword:weapons:10:60:1d8",
    ]);
  });

  it("reads Advanced Fantasy equipment by folder, leaving out coins, poisons and tack", async () => {
    stubFoundry(
      {
        "ose-advancedfantasytome.equipment": pack(
          "af",
          [
            {
              name: "Sword",
              type: "weapon",
              folder: "Weapons",
              cost: 10,
              weight: 60,
              damage: "1d8",
            },
            {
              name: "Plate Mail",
              type: "armor",
              folder: "Armour",
              cost: 60,
              weight: 500,
              armour: { type: "heavy", ac: 3, aac: 16 },
            },
            { name: "Lantern", folder: "Adventuring Gear", cost: 10 },
            { name: "Arrows", folder: "Ammunition", cost: 5 },
            { name: "GP", folder: "Misc", treasure: true },
            { name: "Ingested Poison: I", folder: "Poisons" },
            { name: "Saddle and bridle", folder: "Tack and Harness" },
          ],
          [
            "Weapons",
            "Armour",
            "Adventuring Gear",
            "Ammunition",
            "Misc",
            "Poisons",
            "Tack and Harness",
          ],
        ),
      },
      { tome: true, ascendingAC: true },
    );

    expect(summary(await loadGearCatalog())).toEqual([
      "Arrows:ammunition:5:0",
      "Lantern:gear:10:0",
      "Plate Mail:armour:60:500:AC 16",
      "Sword:weapons:10:60:1d8",
    ]);
  });
});
