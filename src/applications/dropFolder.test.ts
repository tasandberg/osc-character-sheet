import { describe, it, expect, vi } from "vitest";
import {
  droppedItemData,
  folderEntries,
  type DroppableItem,
  type ItemSource,
} from "./dropFolder";

const entry = (uuid: string) => ({ uuid });

const item = (source: ItemSource, inCompendium = false): DroppableItem => ({
  inCompendium,
  toObject: () => structuredClone(source),
});

describe("folderEntries", () => {
  it("includes entries from nested subfolders", () => {
    const getSubfolders = vi.fn(() => [
      { contents: [entry("b")] },
      { contents: [entry("c"), entry("d")] },
    ]);
    const entries = folderEntries({ contents: [entry("a")], getSubfolders });
    expect(entries.map((e) => e.uuid)).toEqual(["a", "b", "c", "d"]);
    expect(getSubfolders).toHaveBeenCalledWith(true);
  });

  it("returns nothing for an empty folder tree", () => {
    expect(folderEntries({ contents: [], getSubfolders: () => [] })).toEqual(
      [],
    );
  });
});

describe("droppedItemData", () => {
  const fromCompendium = vi.fn((dropped: DroppableItem) => ({
    ...dropped.toObject(),
    name: "from pack",
  }));

  it("uses toObject for world items and strips the id", () => {
    const [data] = droppedItemData(
      [
        item({
          _id: "abc",
          name: "Sword",
          type: "weapon",
          system: { cost: 5 },
        }),
      ],
      fromCompendium,
    );
    expect(data).toEqual({
      name: "Sword",
      type: "weapon",
      system: { cost: 5, containerId: "" },
    });
    expect(fromCompendium).not.toHaveBeenCalled();
  });

  it("imports compendium items via fromCompendium without keeping ids", () => {
    const packItem = item({ _id: "p1", name: "Rope", type: "item" }, true);
    const [data] = droppedItemData([packItem], fromCompendium);
    expect(fromCompendium).toHaveBeenCalledWith(packItem, {
      clearFolder: true,
      keepId: false,
    });
    expect(data.name).toBe("from pack");
    expect(data._id).toBeUndefined();
  });

  it("clears container links and container contents", () => {
    const data = droppedItemData(
      [
        item({ name: "Torch", type: "item", system: { containerId: "bag" } }),
        item({
          name: "Sack",
          type: "container",
          system: { containerId: "chest", itemIds: ["x", "y"] },
        }),
      ],
      fromCompendium,
    );
    expect(data[0].system).toEqual({ containerId: "" });
    expect(data[1].system).toEqual({ containerId: "", itemIds: [] });
  });

  it("does not mutate the source item", () => {
    const source = { _id: "k", type: "item", system: { containerId: "bag" } };
    droppedItemData([{ toObject: () => source }], fromCompendium);
    expect(source).toEqual({
      _id: "k",
      type: "item",
      system: { containerId: "bag" },
    });
  });

  it("returns nothing for no items", () => {
    expect(droppedItemData([], fromCompendium)).toEqual([]);
  });
});
