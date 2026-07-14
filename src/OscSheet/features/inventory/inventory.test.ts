import { describe, it, expect } from "vitest";
import { selectInventory, selectEncumbrance, selectCoins, sortInventory, sortEquipped, coinDenom } from "@features/inventory/inventory";
import type { OseItem, OSEActor } from "@domain/types";
import { MODULE_ID, FLAGS } from "@domain/flags";

const mk = (
  type: string,
  name: string,
  system: Record<string, unknown>,
  opts: { id?: string; sort?: number } = {},
): OseItem =>
  ({ _id: opts.id ?? name, name, img: "", type, sort: opts.sort ?? 0, system }) as unknown as OseItem;

const items: OseItem[] = [
  mk("weapon", "Dagger",          { damage: "1d4", melee: true, missile: true, equipped: false, weight: 20, quantity: { value: 1, max: 0 }, tags: [{ label: "Light", icon: "" }, { label: "Thrown", icon: "" }] }),
  mk("armor",  "Ring of protection", { equipped: false, weight: 0, quantity: { value: 1, max: 0 } }),
  mk("item",   "Iron rations",    { weight: 80, quantity: { value: 7, max: 7 } }),
  mk("item",   "Gold piece",      { tags: [{ value: "Currency" }], quantity: { value: 50, max: 0 } }),
];

describe("selectInventory", () => {
  const vm = selectInventory(items);

  it("flat list excludes currency, count = 3", () => {
    expect(vm.count).toBe(3);
    expect(vm.items.map((i) => i.name)).toEqual(["Dagger", "Ring of protection", "Iron rations"]);
  });

  it("assigns category + categoryRank", () => {
    const [dagger, ring, rations] = vm.items;
    expect(dagger.category).toBe("Weapon");
    expect(dagger.categoryRank).toBe(0);
    expect(ring.category).toBe("Armour");
    expect(ring.categoryRank).toBe(1);
    expect(rations.category).toBe("Gear");
    expect(rations.categoryRank).toBe(2);
  });

  it("maps weapon damage, tags, equip state, quantity, monogram", () => {
    const dagger = vm.items[0];
    expect(dagger.damage).toBe("1d4");
    expect(dagger.tags).toEqual([
      { label: "Light", icon: "" },
      { label: "Thrown", icon: "" },
    ]);
    expect(dagger.equipped).toBe(false);
    expect(dagger.quantity).toBeNull(); // qty.value = 1 — not a stack
    const rations = vm.items[2];
    expect(rations.quantity).toEqual({ value: 7, max: 7 });
    expect(rations.monogram).toBe("IR");
  });

  it("non-weapon has empty damage", () => {
    const ring = vm.items[1];
    expect(ring.damage).toBe("");
  });

  it("carries cost; armorClass is AC (descending default) for armour, null otherwise", () => {
    const armor = mk("armor", "Plate Mail", { equipped: true, weight: 500, cost: 60, ac: { value: 3 }, aac: { value: 16 } });
    const [vm2] = selectInventory([armor]).items;
    expect(vm2.cost).toBe(60);
    // game.settings unavailable in tests ⇒ ascendingAC() falls back to false ⇒ AC
    expect(vm2.armorClass).toEqual({ label: "AC", value: 3 });
    // non-armour carries no armorClass
    expect(selectInventory([mk("weapon", "Axe", { damage: "1d8", cost: 5 })]).items[0].armorClass).toBeNull();
  });

  it("dedupes tags by label", () => {
    const dup = mk("weapon", "Sword", {
      damage: "1d8",
      melee: true,
      weight: 30,
      tags: [{ label: "Melee", icon: "" }, { label: "Melee", icon: "" }, { label: "Heavy", icon: "" }],
    });
    const vm2 = selectInventory([dup]);
    expect(vm2.items[0].tags.map((t) => t.label)).toEqual(["Melee", "Heavy"]);
  });

  it("excludes Currency label from tags list", () => {
    const item = mk("item", "Gem", { weight: 5, tags: [{ label: "Currency", icon: "" }, { label: "Precious", icon: "" }] });
    const vm2 = selectInventory([item]);
    expect(vm2.items[0].tags.map((t) => t.label)).toEqual(["Precious"]);
  });

  it("legacy groups still present for grid view", () => {
    expect(vm.groups.map((g) => g.key)).toContain("weapons");
  });

  it("equipped items appear in both the main list and the equipped subset", () => {
    const vm2 = selectInventory([
      mk("weapon", "Sword", { equipped: true, weight: 30 }),
      mk("armor", "Shield", { equipped: false, weight: 10 }),
    ]);
    expect(vm2.equipped.map((i) => i.name)).toEqual(["Sword"]);
    expect(vm2.items.map((i) => i.name)).toEqual(["Sword", "Shield"]);
    expect(vm2.count).toBe(2);
  });

  it("equipped subset includes an equipped nested item still listed under its container", () => {
    const vm2 = selectInventory([
      mk("container", "Bag", { weight: 5 }, { id: "bag" }),
      mk("weapon", "Sword", { equipped: true, weight: 30, containerId: "bag" }, { id: "sword" }),
    ]);
    expect(vm2.items.map((i) => i.id)).toEqual(["bag"]);
    expect(vm2.items[0].children.map((c) => c.id)).toEqual(["sword"]);
    expect(vm2.equipped.map((i) => i.id)).toEqual(["sword"]);
  });

  it("excludes non-physical types (spells, abilities)", () => {
    const vm2 = selectInventory([
      mk("weapon", "Sword", { weight: 30 }),
      mk("spell", "Magic Missile", {}),
      mk("ability", "Listening at Doors", {}),
    ]);
    expect(vm2.items.map((i) => i.name)).toEqual(["Sword"]);
  });
});

describe("selectInventory — container tree", () => {
  const bag   = mk("container", "Bag",    { weight: 10 },  { id: "bag" });
  const sword = mk("weapon",    "Sword",  { damage: "1d8", melee: true, weight: 30, containerId: "bag" }, { id: "sword", sort: 2 });
  const torch = mk("item",      "Torch",  { weight: 5,  containerId: "bag" }, { id: "torch", sort: 1 });
  const rope  = mk("item",      "Rope",   { weight: 15 }, { id: "rope" });

  const vm = selectInventory([bag, sword, torch, rope]);

  it("top-level contains bag + rope, not nested items", () => {
    expect(vm.items.map((i) => i.id)).toEqual(["bag", "rope"]);
  });

  it("container carries children sorted by sort asc", () => {
    const bagVM = vm.items[0];
    expect(bagVM.isContainer).toBe(true);
    expect(bagVM.children.map((c) => c.id)).toEqual(["torch", "sword"]);
  });

  it("count includes all items in tree", () => {
    expect(vm.count).toBe(4);
  });

  it("orphan containerId (container not in list) → top-level", () => {
    const orphan = mk("item", "Orphan", { weight: 1, containerId: "nonexistent" }, { id: "orphan" });
    const vm2 = selectInventory([orphan]);
    expect(vm2.items[0].id).toBe("orphan");
    expect(vm2.items[0].children).toEqual([]);
  });
});

describe("sortInventory", () => {
  const mkVM = (overrides: Partial<import("@domain/vm-types").InventoryItemVM>): import("@domain/vm-types").InventoryItemVM => ({
    id: "x", name: "X", img: "", category: "Gear", categoryRank: 2,
    damage: "", tags: [], monogram: "XX", weight: 0, cost: 0, armorClass: null, sort: 0, equippedSort: 0,
    equipped: null, quantity: null, isContainer: false, children: [],
    ...overrides,
  });

  const sword  = mkVM({ id: "sw", name: "Sword",  category: "Weapon",    categoryRank: 0, weight: 30, sort: 1 });
  const shield = mkVM({ id: "sh", name: "Shield",  category: "Armour",    categoryRank: 1, weight: 15, sort: 0 });
  const rope   = mkVM({ id: "ro", name: "Rope",    category: "Gear",      categoryRank: 2, weight: 5,  sort: 0 });
  const box    = mkVM({ id: "bx", name: "Box",     category: "Container", categoryRank: 3, weight: 50, sort: 0 });

  it("category sort: by rank, then sort, then name", () => {
    const result = sortInventory([rope, box, sword, shield], "category");
    expect(result.map((i) => i.id)).toEqual(["sw", "sh", "ro", "bx"]);
  });

  it("name sort: localeCompare", () => {
    const result = sortInventory([rope, box, sword, shield], "name");
    expect(result.map((i) => i.name)).toEqual(["Box", "Rope", "Shield", "Sword"]);
  });

  it("weight sort: descending", () => {
    const result = sortInventory([rope, box, sword, shield], "weight");
    expect(result.map((i) => i.id)).toEqual(["bx", "sw", "sh", "ro"]);
  });

  it("dir reverses the column: name desc → Z→A", () => {
    const result = sortInventory([rope, box, sword, shield], "name", "desc");
    expect(result.map((i) => i.name)).toEqual(["Sword", "Shield", "Rope", "Box"]);
  });

  it("weight asc: lightest first", () => {
    const result = sortInventory([rope, box, sword, shield], "weight", "asc");
    expect(result.map((i) => i.id)).toEqual(["ro", "sh", "sw", "bx"]);
  });

  it("equipped state does not affect order (no hoisting)", () => {
    const a = mkVM({ id: "a", name: "Aaa", categoryRank: 2, equipped: false });
    const b = mkVM({ id: "b", name: "Zzz", categoryRank: 2, equipped: true });
    // pure name order — equipped Zzz stays after Aaa
    expect(sortInventory([a, b], "name").map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("recurses into children", () => {
    const parent = mkVM({
      id: "p", name: "Parent", isContainer: true,
      children: [
        mkVM({ id: "c1", name: "Zap", weight: 1 }),
        mkVM({ id: "c2", name: "Ant", weight: 2 }),
      ],
    });
    const result = sortInventory([parent], "name");
    expect(result[0].children.map((c) => c.name)).toEqual(["Ant", "Zap"]);
  });
});

describe("sortEquipped", () => {
  const mkVM = (id: string, name: string, equippedSort: number): import("@domain/vm-types").InventoryItemVM => ({
    id, name, img: "", category: "Gear", categoryRank: 2, damage: "", tags: [],
    monogram: "XX", weight: 0, cost: 0, armorClass: null, sort: 0, equippedSort, equipped: true, quantity: null,
    isContainer: false, children: [],
  });

  it("orders by equippedSort, ties broken by name", () => {
    const a = mkVM("a", "Zaa", 100);
    const b = mkVM("b", "Aaa", 300);
    const c = mkVM("c", "Mmm", 100); // tie with a on sort → name decides
    expect(sortEquipped([b, a, c]).map((i) => i.id)).toEqual(["c", "a", "b"]);
  });
});

describe("selectInventory — equipped tray order", () => {
  it("orders the equipped subset by the equippedOrder flag, independent of list order", () => {
    const flagged = (id: string, name: string, order: number, equippedOrder: number): OseItem =>
      ({
        _id: id, name, img: "", type: "weapon", sort: order,
        system: { equipped: true, weight: 10 },
        flags: { [MODULE_ID]: { [FLAGS.order]: order, [FLAGS.equippedOrder]: equippedOrder } },
      }) as unknown as OseItem;
    // List order (FLAGS.order) is A,B; tray order (equippedOrder) is reversed.
    const vm = selectInventory([flagged("a", "A", 100, 200), flagged("b", "B", 200, 100)]);
    expect(vm.items.map((i) => i.id)).toEqual(["a", "b"]);     // list keeps `order`
    expect(vm.equipped.map((i) => i.id)).toEqual(["b", "a"]);  // tray uses `equippedOrder`
  });
});

describe("selectEncumbrance", () => {
  it("computes pct + status + movement", () => {
    const actor = {
      system: { encumbrance: { value: 380, max: 1600, enabled: true }, movement: { base: 120 } },
    } as unknown as OSEActor;
    const e = selectEncumbrance(actor);
    expect(e.pct).toBeCloseTo(0.2375);
    expect(e.tier).toBe(0);
    expect(e.status).toBe("Unencumbered");
    expect(e.label).toBe("380 / 1600 cn");
    expect(e.move).toBe(120);
  });

  it("exposes all three movement bands from the system's movement data", () => {
    const actor = {
      system: {
        encumbrance: { value: 380, max: 1600, enabled: true },
        movement: { base: 120, encounter: 40, overland: 24 },
      },
    } as unknown as OSEActor;
    expect(selectEncumbrance(actor).moveBands).toEqual({
      encounter: 40,
      explore: 120,
      travel: 24,
    });
  });

  it("drives tier/status off the system breakpoint flags, not raw %", () => {
    // 1071/1600 = 67%: old %-buckets said "Lightly"; OSE flags it at the 3rd
    // breakpoint (move already 30'), so it must read "Severely encumbered".
    const actor = {
      system: {
        encumbrance: {
          value: 1071, max: 1600, enabled: true, variant: "detailed",
          encumbered: false, atFirstBreakpoint: true, atSecondBreakpoint: true, atThirdBreakpoint: true,
        },
        movement: { base: 30 },
      },
    } as unknown as OSEActor;
    const e = selectEncumbrance(actor);
    expect(e.tier).toBe(3);
    expect(e.status).toBe("Severely encumbered");
    expect(e.move).toBe(30);
  });

  it("basic variant: bar fills from tier (not weight) and drops the cn load", () => {
    // 100/1600 cn weight is meaningless in basic (tier comes from armor/treasure).
    const actor = {
      system: {
        encumbrance: {
          value: 100, max: 1600, enabled: true, variant: "basic",
          encumbered: false, atFirstBreakpoint: true, atSecondBreakpoint: true, atThirdBreakpoint: false,
        },
        movement: { base: 60 },
      },
    } as unknown as OSEActor;
    const e = selectEncumbrance(actor);
    expect(e.tier).toBe(2);
    expect(e.label).toBe(""); // no misleading "100 / 1600 cn"
    expect(e.pct).toBeCloseTo(2 / 3); // bar tracks the tier, not 100/1600
  });

  it("labels item-based encumbrance in items, not cn", () => {
    const actor = {
      system: {
        encumbrance: { value: 10, max: 16, enabled: true, variant: "itembased", encumbered: false },
        movement: { base: 120 },
      },
    } as unknown as OSEActor;
    expect(selectEncumbrance(actor).label).toBe("10 / 16 items");
  });
});

describe("selectCoins", () => {
  it("reads gpEach from system.cost, falling back to the standard rate", () => {
    const coins = selectCoins([
      mk("item", "GP", { treasure: true, cost: 1, quantity: { value: 1 } }),
      mk("item", "EP", { treasure: true, cost: 0.5, quantity: { value: 300 } }),
      mk("item", "CP", { treasure: true, quantity: { value: 50 } }), // no cost → fallback 0.01
    ]);
    const by = Object.fromEntries(coins.map((c) => [c.denom, c.gpEach]));
    expect(by).toEqual({ GP: 1, EP: 0.5, CP: 0.01 });
    // total = 1·1 + 300·0.5 + 50·0.01 = 151.5 gp
    expect(coins.reduce((s, c) => s + c.value * c.gpEach, 0)).toBeCloseTo(151.5);
  });
});

describe("coinDenom", () => {
  it("reads the denomination across compendium naming conventions", () => {
    expect(coinDenom("GP")).toBe("gp"); // bare (system / Item Piles short)
    expect(coinDenom("sp")).toBe("sp");
    expect(coinDenom("[01.00] gold (gp)")).toBe("gp"); // classic-fantasy bracketed
    expect(coinDenom("[00.50] electrum (ep)")).toBe("ep");
    expect(coinDenom("Gold Pieces")).toBe("gp"); // full name (osr-helper-style)
    expect(coinDenom("Silver Coins")).toBe("sp");
    expect(coinDenom("Platinum Piece")).toBe("pp"); // singular
  });
  it("does not misread non-coin treasure as coins", () => {
    expect(coinDenom("Gold ring")).toBeNull();
    expect(coinDenom("Silver chalice")).toBeNull();
    expect(coinDenom("Gemstone")).toBeNull();
  });
});
