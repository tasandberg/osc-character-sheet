import { describe, it, expect } from "vitest";
import { itemArt } from "@domain/itemArt";

describe("itemArt", () => {
  it("draws the sword icon for the compendium sword", () => {
    expect(
      itemArt({
        type: "weapon",
        name: "Sword",
        img: "icons/weapons/swords/sword-guard-brass-worn.webp",
      }),
    ).toEqual({ icon: "sword", img: "" });
  });

  it("falls back to the item name when its image is the OSE default", () => {
    expect(
      itemArt({
        type: "item",
        name: "Crowbar",
        img: "systems/ose/assets/default/item.png",
      }),
    ).toEqual({ icon: "crowbar", img: "" });
  });

  it("keeps a custom image on an item it cannot place", () => {
    expect(
      itemArt({
        type: "item",
        name: "Grandmother's Locket",
        img: "worlds/mine/locket.png",
      }),
    ).toEqual({ icon: null, img: "worlds/mine/locket.png" });
  });

  it("drops the OSE default image so the monogram shows", () => {
    expect(
      itemArt({
        type: "item",
        name: "Tinder box (flint & steel)",
        img: "systems/ose/assets/default/item.png",
      }),
    ).toEqual({ icon: null, img: "" });
  });
});
