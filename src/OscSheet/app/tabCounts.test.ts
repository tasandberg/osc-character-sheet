import { describe, it, expect } from "vitest";
import type { OSEActor, OseItem } from "@domain/types";
import { TabIds } from "@app/tabs";
import { selectTabCounts } from "@app/tabCounts";

const mk = (type: string, id: string, system: Record<string, unknown> = {}) =>
  ({ _id: id, name: id, img: "", type, system }) as unknown as OseItem;

const actor = {
  system: {
    spells: {
      spellList: {
        1: [mk("spell", "s1"), mk("spell", "s2")],
        2: [mk("spell", "s3")],
      },
    },
    abilities: [mk("ability", "a1")],
  },
} as unknown as OSEActor;

const items = [
  mk("container", "bag"),
  mk("item", "rope", { containerId: "bag", quantity: { value: 3, max: 0 } }),
  mk("weapon", "sword"),
  mk("item", "gold", { treasure: true, quantity: { value: 50, max: 0 } }),
  mk("spell", "s1"),
  mk("ability", "a1"),
];

describe("selectTabCounts", () => {
  it("counts spells, abilities and physical inventory rows incl. nested, excl. treasure", () => {
    expect(selectTabCounts(actor, items)).toEqual({
      [TabIds.SPELLS]: 3,
      [TabIds.ABILITIES]: 1,
      [TabIds.INVENTORY]: 3,
    });
  });
});
