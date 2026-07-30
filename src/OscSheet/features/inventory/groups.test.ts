// The load-figure seam: one formatter decides whether a row/section reads in coins
// or in item slots, so the unit can never drift from the number it labels.
import { describe, it, expect } from "vitest";
import {
  countedLoad,
  loadText,
  loadHeading,
  sectionCountLabel,
} from "@features/inventory/groups";
import type { InventoryItemVM } from "@domain/vm-types";

const mkVM = (o: Partial<InventoryItemVM> = {}): InventoryItemVM => ({
  id: "x", name: "X", img: "", category: "Gear", categoryRank: 2, damage: "",
  tags: [], monogram: "XX", weight: 0, slots: 0, cost: 0, armorClass: null,
  sort: 0, equippedSort: 0, equipped: null, quantity: null, treasure: false,
  isContainer: false, children: [], ...o,
});

describe("countedLoad", () => {
  it("itembased: bare slot count, unit lives in the header", () => {
    expect(countedLoad(mkVM({ slots: 3, weight: 80 }), "itembased")).toEqual({
      value: "3",
      unit: "",
    });
  });

  it("itembased: zero slots render a literal 0 — a field awaiting a GM value", () => {
    expect(loadText(countedLoad(mkVM({ slots: 0, weight: 50 }), "itembased"))).toBe("0");
  });

  it("itembased: treasure has no honest per-row figure (counted per section)", () => {
    expect(loadText(countedLoad(mkVM({ treasure: true, slots: 2 }), "itembased"))).toBe("—");
  });

  it("other variants keep the cn behaviour, dash for weightless included", () => {
    for (const variant of [undefined, "basic", "detailed", "complete"]) {
      expect(loadText(countedLoad(mkVM({ weight: 80, slots: 3 }), variant))).toBe("80 cn");
      expect(loadText(countedLoad(mkVM({ weight: 0, slots: 3 }), variant))).toBe("—");
    }
  });
});

describe("loadHeading", () => {
  it("itembased swaps the column and popover labels to Slots", () => {
    expect(loadHeading("itembased")).toEqual({ column: "Slots", stat: "Slots" });
    expect(loadHeading("basic")).toEqual({ column: "Wt", stat: "Wgt" });
    expect(loadHeading()).toEqual({ column: "Wt", stat: "Wgt" });
  });
});

describe("sectionCountLabel", () => {
  const items = [
    mkVM({ id: "a", weight: 30, slots: 1 }),
    mkVM({
      id: "bag", weight: 20, slots: 1, isContainer: true,
      children: [mkVM({ id: "c", weight: 5, slots: 2 })],
    }),
  ];

  it("totals slots under itembased", () => {
    expect(sectionCountLabel(items, "itembased")).toBe("3 items · 4 slots");
  });

  it("still totals cn otherwise", () => {
    expect(sectionCountLabel(items)).toBe("3 items · 55 cn");
    expect(sectionCountLabel(items, "basic")).toBe("3 items · 55 cn");
  });
});
