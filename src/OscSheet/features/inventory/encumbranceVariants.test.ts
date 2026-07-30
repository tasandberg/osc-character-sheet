// One inventory, every encumbrance variant: the row figure, the column heading and the
// section total are asserted together, so a change to any of them has to stay consistent
// with the other two. `itembased` reads in slots; every other variant reads in coins.
import { describe, it, expect } from "vitest";
import {
  countedLoad,
  loadText,
  loadHeading,
  sectionCountLabel,
} from "@features/inventory/groups";
import { selectInventory } from "@features/inventory/inventory";
import type { InventoryItemVM } from "@domain/vm-types";
import type { OseItem } from "@domain/types";

const mkVM = (o: Partial<InventoryItemVM> = {}): InventoryItemVM => ({
  id: "x", name: "X", img: "", category: "Gear", categoryRank: 2, damage: "",
  tags: [], monogram: "XX", weight: 0, slots: 0, cost: 0, armorClass: null,
  sort: 0, equippedSort: 0, equipped: null, quantity: null, treasure: false,
  isContainer: false, children: [], ...o,
});

// weight and slots deliberately disagree on every row, so a variant that read the wrong
// field would produce a wrong number rather than an accidentally-correct one.
const sword = mkVM({ id: "sword", name: "Sword", weight: 60, slots: 1 });
const arrows = mkVM({ id: "arrows", name: "Arrows", weight: 10, slots: 17 });
const unset = mkVM({ id: "unset", name: "Unset gear", weight: 0, slots: 0 });
// treasure gets slots: 0 from slotsOf — it's bucketed globally by the Treasure section.
const coins = mkVM({ id: "gp", name: "GP", weight: 900, slots: 0, treasure: true });
const pack = mkVM({
  id: "pack", name: "Backpack", weight: 20, slots: 1, isContainer: true,
  children: [mkVM({ id: "rope", name: "Rope", weight: 50, slots: 2 })],
});

const inventory = [sword, arrows, unset, coins, pack];

/** Every variant the system's enum carries, plus the no-encumbrance case. */
const CN_VARIANTS = [undefined, "", "basic", "detailed", "complete"] as const;

const mkItem = (
  type: string,
  name: string,
  system: Record<string, unknown>,
): OseItem =>
  ({ _id: name, name, img: "", type, sort: 0, system }) as unknown as OseItem;

describe("slot derivation", () => {
  it("folds quantity for gear but not for weapons or armour", () => {
    const vm = selectInventory([
      mkItem("item", "Arrows", { itemslots: 1, quantity: { value: 17, max: 0 } }),
      mkItem("weapon", "Dagger", { itemslots: 1, quantity: { value: 3, max: 0 } }),
      mkItem("armor", "Plate", { itemslots: 2, quantity: { value: 2, max: 0 } }),
    ]);
    const by = (n: string) => vm.items.find((i) => i.name === n)!;
    expect(by("Arrows").slots).toBe(17);
    expect(by("Dagger").slots).toBe(1);
    expect(by("Plate").slots).toBe(2);
  });

  it("counts a container as the system does — quantity 0, so 0 slots", () => {
    const vm = selectInventory([
      mkItem("container", "Backpack", { itemslots: 1, quantity: { value: 0, max: 0 } }),
    ]);
    expect(vm.items.find((i) => i.name === "Backpack")!.slots).toBe(0);
  });

  it("gives treasure no slots — it is bucketed globally, 100 to a slot", () => {
    const vm = selectInventory([
      mkItem("item", "Gem", {
        treasure: true, itemslots: 1, quantity: { value: 900, max: 0 },
      }),
    ]);
    // Counting it per-row would make section totals disagree with their rows, and
    // ceil(qty × itemslots) is the wrong rule for treasure anyway.
    for (const it of vm.items) expect(it.slots).toBe(0);
  });
});

describe("row figures across every variant", () => {
  it("itembased reads slots, and only itembased", () => {
    expect(loadText(countedLoad(sword, "itembased"))).toBe("1");
    expect(loadText(countedLoad(arrows, "itembased"))).toBe("17");
    for (const v of CN_VARIANTS) {
      expect(loadText(countedLoad(sword, v))).toBe("60 cn");
      expect(loadText(countedLoad(arrows, v))).toBe("10 cn");
    }
  });

  it("zero reads as 0 under slots but as a dash under coins", () => {
    expect(loadText(countedLoad(unset, "itembased"))).toBe("0");
    for (const v of CN_VARIANTS) expect(loadText(countedLoad(unset, v))).toBe("—");
  });

  it("treasure has no per-row slot figure, but does have a weight", () => {
    expect(loadText(countedLoad(coins, "itembased"))).toBe("—");
    for (const v of CN_VARIANTS) expect(loadText(countedLoad(coins, v))).toBe("900 cn");
  });
});

describe("column heading follows the same variant", () => {
  it("says Slots only under itembased", () => {
    expect(loadHeading("itembased").column).toBe("Slots");
    for (const v of CN_VARIANTS) expect(loadHeading(v).column).toBe("Wt");
  });
});

describe("section totals across every variant", () => {
  // 6 rows once the container's child is flattened.
  it("sums slots under itembased, excluding treasure", () => {
    // 1 + 17 + 0 + 1 + 2 = 21; the coin row contributes nothing per-row.
    expect(sectionCountLabel(inventory, "itembased")).toBe("6 items · 21 slots");
  });

  it("sums cn for every other variant", () => {
    for (const v of CN_VARIANTS) {
      expect(sectionCountLabel(inventory, v)).toBe("6 items · 1040 cn");
    }
  });

  it("shows a cap when the section maps to a track, e.g. Equipped", () => {
    expect(sectionCountLabel([sword, arrows], "itembased", 9)).toBe(
      "2 items · 18 / 9 slots",
    );
    // No cap passed → no denominator. All Items holds both tracks, so it never gets one.
    expect(sectionCountLabel([sword, arrows], "itembased")).toBe("2 items · 18 slots");
  });
});
