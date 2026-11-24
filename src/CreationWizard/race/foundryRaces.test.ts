import { afterEach, describe, expect, it, vi } from "vitest";
import { loadRaces } from "./foundryRaces";

const raceDoc = (pack: string | null, name: string) => ({
  uuid: `${pack ? `Compendium.${pack}.Item` : "Item"}.${name}`,
  type: "race",
  toObject: () => ({ name, system: { key: name.toLowerCase() } }),
});

afterEach(() => vi.unstubAllGlobals());

describe("loadRaces", () => {
  it("lists a race imported into the world once, preferring the world copy", async () => {
    const worldDwarf = raceDoc(null, "Dwarf");
    const packDocs = [
      raceDoc("ose-advancedfantasytome.races", "Dwarf"),
      raceDoc("ose-advancedfantasytome.races", "Elf"),
    ];
    vi.stubGlobal("game", {
      system: { id: "ose" },
      items: { filter: () => [worldDwarf], fromCompendium: () => ({}) },
      packs: {
        contents: [
          {
            collection: "ose-advancedfantasytome.races",
            documentName: "Item",
            getIndex: async () =>
              packDocs.map((d) => ({ _id: d.uuid, type: "race" })),
            getDocuments: async () => packDocs,
          },
        ],
      },
    });
    expect((await loadRaces()).map((race) => race.uuid)).toEqual([
      worldDwarf.uuid,
      packDocs[1].uuid,
    ]);
  });
});
