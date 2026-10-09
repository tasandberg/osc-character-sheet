import { afterEach, describe, expect, it, vi } from "vitest";
import { loadGearCatalog } from "./foundryGear";

type Entry = {
  name: string;
  folder?: string;
  cost?: number;
  weight?: number | null;
  treasure?: boolean;
};

const pack = (id: string, entries: Entry[], folders: string[] = []) => ({
  folders: { contents: folders.map((name) => ({ id: name, name })) },
  getIndex: async () =>
    entries.map((e) => ({
      uuid: `Compendium.${id}.Item.${e.name}`,
      name: e.name,
      img: "icon.webp",
      folder: e.folder ?? null,
      system: { cost: e.cost ?? 1, weight: e.weight, treasure: e.treasure },
    })),
});

function stubFoundry(
  packs: Record<string, ReturnType<typeof pack>>,
  tome = false,
) {
  vi.stubGlobal("game", {
    packs: { get: (id: string) => packs[id] },
    modules: { get: () => ({ active: tome }) },
  });
  vi.stubGlobal("CONFIG", {
    OSE: { classes: { classic: {}, advanced: tome ? { elf: {} } : {} } },
  });
}

afterEach(() => vi.unstubAllGlobals());

const summary = (items: Awaited<ReturnType<typeof loadGearCatalog>>) =>
  items.map((i) => `${i.name}:${i.category}:${i.cost}:${i.weight}`);

describe("loadGearCatalog", () => {
  it("reads the Classic Fantasy equipment packs without coins", async () => {
    stubFoundry({
      "classicfantasycompendium.equipment-weapons": pack("w", [
        { name: "Sword", cost: 10, weight: 60 },
      ]),
      "classicfantasycompendium.equipment-armour": pack("a", [
        { name: "Chainmail", cost: 40, weight: 400 },
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
      "Chainmail:armour:40:400",
      "Rope:gear:1:0",
      "Sword:weapons:10:60",
    ]);
  });

  it("reads Advanced Fantasy equipment by folder, leaving out coins, poisons and tack", async () => {
    stubFoundry(
      {
        "ose-advancedfantasytome.equipment": pack(
          "af",
          [
            { name: "Sword", folder: "Weapons", cost: 10, weight: 60 },
            { name: "Shield", folder: "Armour", cost: 10, weight: 100 },
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
      true,
    );

    expect(summary(await loadGearCatalog())).toEqual([
      "Arrows:ammunition:5:0",
      "Lantern:gear:10:0",
      "Shield:armour:10:100",
      "Sword:weapons:10:60",
    ]);
  });
});
