import { describe, it, expect } from "vitest";
import { selectInventory, selectEncumbrance, selectCoins, selectTreasure, selectWealth, sortWealth, sortInventory, sortEquipped, coinDenom, encBarStops } from "@features/inventory/inventory";
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
  mk("item",   "Gold piece",      { treasure: true, tags: [{ value: "Currency" }], quantity: { value: 50, max: 0 } }),
];

describe("selectInventory", () => {
  const vm = selectInventory(items);

  it("flat list excludes treasure (coins), count = 3", () => {
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

  it("keeps quantity on a stackable down to its last unit (max-driven)", () => {
    // 1 of 24 arrows: still stackable (max>1), so the qty control persists to the end.
    const last = selectInventory([
      mk("weapon", "Arrows", { quantity: { value: 1, max: 24 }, weight: 5 }),
    ]).items[0];
    expect(last.quantity).toEqual({ value: 1, max: 24 });
    // A true singleton (sword, qty 1 / max 0) still carries no quantity.
    const sword = selectInventory([
      mk("weapon", "Sword", { quantity: { value: 1, max: 0 }, weight: 30 }),
    ]).items[0];
    expect(sword.quantity).toBeNull();
    // A plain multi with no max still shows (max falls back to value).
    const spikes = selectInventory([
      mk("item", "Iron spikes", { quantity: { value: 12 }, weight: 1 }),
    ]).items[0];
    expect(spikes.quantity).toEqual({ value: 12, max: 12 });
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
  it("computes pct + status + the three movement rates", () => {
    const actor = {
      system: {
        encumbrance: { value: 380, max: 1600, enabled: true },
        movement: { base: 120, encounter: 40, overland: 24 },
      },
    } as unknown as OSEActor;
    const e = selectEncumbrance(actor);
    expect(e.pct).toBeCloseTo(0.2375);
    expect(e.tier).toBe(0);
    expect(e.status).toBe("Unencumbered");
    expect(e.label).toBe("380 / 1600 cn");
    expect(e.moveBands).toEqual({ encounter: 40, explore: 120, travel: 24 });
  });

  it("drives tier/status off the system breakpoint flags, not raw %", () => {
    // 1071/1600 = 67%: old %-buckets said "Lightly"; OSE flags it at the 3rd
    // breakpoint (move already 30'), so it must read "Severely encumbered".
    const actor = {
      system: {
        encumbrance: {
          value: 1071, max: 1600, enabled: true, variant: "detailed", steps: [25, 37.5, 50],
          encumbered: false, atFirstBreakpoint: true, atSecondBreakpoint: true, atThirdBreakpoint: true,
        },
        movement: { base: 30, encounter: 10, overland: 6 },
      },
    } as unknown as OSEActor;
    const e = selectEncumbrance(actor);
    expect(e.tier).toBe(3);
    expect(e.status).toBe("Severely encumbered");
    expect(e.moveBands.explore).toBe(30);
    // the bar's colour cuts land on the system's own thresholds, not even thirds
    expect(e.bands).toEqual([25, 37.5, 50]);
  });

  it("basic variant: bar fills treasure vs the 1600 cap, green below the significant line", () => {
    // basic gauges carried treasure against the immobile cap → bar = treasure / max (1600).
    // 400/1600 = 25%, under the significant line (steps[0] = 50%), so it reads green. Armor
    // does NOT move the bar (its slowdown shows in the tier-tinted rates).
    const actor = {
      system: {
        encumbrance: {
          value: 400, max: 1600, enabled: true, variant: "basic", steps: [50],
          encumbered: false, atFirstBreakpoint: true, atSecondBreakpoint: true, atThirdBreakpoint: false,
        },
        movement: { base: 60, encounter: 20, overland: 12 },
      },
    } as unknown as OSEActor;
    const e = selectEncumbrance(actor);
    expect(e.label).toBe("400 / 1600 cn"); // treasure carried vs the 1600 immobile cap
    expect(e.pct).toBeCloseTo(0.25); // 400 treasure / 1600 cap — armor tier ignored
    expect(e.tier).toBe(0); // 25% fill sits below the significant line — green
    // significant line + two visual stops ramping yellow→red toward the cap
    expect(e.bands).toEqual([50, 75, 90]);
    expect(e.barTier).toBe(e.tier); // not immobile — solid colour unused, defaults to tier
  });

  it("basic variant: treasure past the significant line ramps toward red", () => {
    const actor = {
      system: {
        encumbrance: {
          value: 1200, max: 1600, enabled: true, variant: "basic", steps: [50],
          encumbered: false, atFirstBreakpoint: true, atSecondBreakpoint: false, atThirdBreakpoint: false,
        },
        movement: { base: 60, encounter: 20, overland: 12 },
      },
    } as unknown as OSEActor;
    const e = selectEncumbrance(actor);
    expect(e.pct).toBeCloseTo(0.75); // 1200 / 1600, past the 50% significant line
    expect(e.bands).toEqual([50, 75, 90]); // ramps yellow→red as it nears the cap
    expect(e.tier).toBe(2); // 75% fill — mid-ramp (amber), climbing to red near the cap
  });

  it("basic variant: treasure at/above the cap is immobile — full red bar", () => {
    const actor = {
      system: {
        encumbrance: {
          value: 1600, max: 1600, enabled: true, variant: "basic", steps: [50],
          encumbered: false, atFirstBreakpoint: true, atSecondBreakpoint: false, atThirdBreakpoint: false,
        },
        movement: { base: 30, encounter: 10, overland: 6 },
      },
    } as unknown as OSEActor;
    const e = selectEncumbrance(actor);
    expect(e.pct).toBe(1); // treasure hits the cap — bar full
    expect(e.bands).toEqual([]); // solid, not a gradient
    expect(e.tier).toBe(4); // overloaded
    expect(e.status).toBe("Overloaded");
    expect(e.barTier).toBe(4); // solid dim-red — immobile
    expect(e.label).toBe("1600 / 1600 cn");
  });

  it("basic variant: heavy armor + low treasure stays a LOW (green) fill", () => {
    // Armor slows movement in basic OSE but must NOT tint the bar/scores: with only 15
    // treasure the fill is short and green (tier 0). Armor surfaces as its own tier.
    const actor = {
      system: {
        encumbrance: {
          value: 15, max: 1600, enabled: true, variant: "basic", steps: [50],
          encumbered: false, atFirstBreakpoint: false, atSecondBreakpoint: true, atThirdBreakpoint: false,
        },
        movement: { base: 60, encounter: 20, overland: 12 },
      },
    } as unknown as OSEActor;
    const e = selectEncumbrance(actor);
    expect(e.tier).toBe(0); // fill is green — armor no longer bumps the colour
    expect(e.armorTier).toBe("heavy"); // surfaced separately (atSecond && !atFirst)
    expect(e.pct).toBeCloseTo(15 / 1600); // ~0.9% — a short green bar
  });

  it("labels item-based encumbrance in items, not cn", () => {
    const actor = {
      system: {
        encumbrance: {
          value: 10, max: 16, enabled: true, variant: "itembased", encumbered: false,
          steps: [62.5, 75, 87.5],
        },
        movement: { base: 120, encounter: 40, overland: 24 },
      },
    } as unknown as OSEActor;
    const e = selectEncumbrance(actor);
    expect(e.label).toBe("10 / 16 items");
    // item-based steps differ per mode (packed vs equipped) — take them as given
    expect(e.bands).toEqual([62.5, 75, 87.5]);
  });
});

describe("significant treasure (basic encumbrance)", () => {
  // Stands in for OSE's basic encumbrance class, incl. the line that made the old
  // boolean bite: `options.significantTreasure || 800` keeps a `true`, turning every
  // threshold check into `value >= true` — i.e. 1cn of treasure trips it.
  class FakeBasic {
    static lastOptions: { significantTreasure: unknown } | undefined;
    variant = "basic";
    enabled = true;
    max: number;
    value: number;
    encumbered = false;
    atSecondBreakpoint = false;
    atThirdBreakpoint = false;
    threshold: number;
    constructor(max: number, its: OseItem[], options: { significantTreasure: unknown }) {
      FakeBasic.lastOptions = options;
      this.max = max;
      this.threshold = (options?.significantTreasure as number) || 800;
      this.value = its.reduce(
        (a, i) =>
          a + (i.system.treasure ? (i.system.quantity?.value ?? 0) * (i.system.weight ?? 0) : 0),
        0,
      );
    }
    get atFirstBreakpoint() {
      return this.value >= this.threshold;
    }
    // mirror the real basic class: a single step at the significant-treasure line
    get steps() {
      return [(100 * this.threshold) / this.max];
    }
  }

  const basicActor = () =>
    ({
      system: {
        encumbrance: new FakeBasic(1600, [], { significantTreasure: 800 }),
        movement: { base: 120, encounter: 40, overland: 24 },
        scores: { str: { mod: 0 } },
      },
    }) as unknown as OSEActor;

  it("passes the threshold as a number, so a single gem doesn't encumber", () => {
    const gem = mk("item", "Gem", { treasure: true, weight: 10, quantity: { value: 1 } });
    const e = selectEncumbrance(basicActor(), [gem]);
    expect(typeof FakeBasic.lastOptions?.significantTreasure).toBe("number");
    expect(FakeBasic.lastOptions?.significantTreasure).toBe(800); // OSE default, not `true`
    expect(e.tier).toBe(0);
    expect(e.status).toBe("Unencumbered");
  });

  it("still trips once the treasure actually reaches the threshold", () => {
    const hoard = mk("item", "Gems", { treasure: true, weight: 10, quantity: { value: 80 } });
    expect(selectEncumbrance(basicActor(), [hoard]).tier).toBe(1);
  });

  it("reads the load as carried treasure vs the 1600 cap", () => {
    const gems = mk("item", "Gems", { treasure: true, weight: 1, quantity: { value: 181 } });
    expect(selectEncumbrance(basicActor(), [gems]).label).toBe("181 / 1600 cn");
  });

  it("shows 0 against the cap when carrying no treasure", () => {
    const sword = mk("weapon", "Sword", { weight: 60, quantity: { value: 1 } });
    expect(selectEncumbrance(basicActor(), [sword]).label).toBe("0 / 1600 cn");
  });

  it("goes immobile (full red bar) once treasure reaches the cap", () => {
    const hoard = mk("item", "Coins", { treasure: true, weight: 1, quantity: { value: 1600 } });
    const e = selectEncumbrance(basicActor(), [hoard]);
    expect(e.pct).toBe(1);
    expect(e.bands).toEqual([]);
    expect(e.barTier).toBe(4); // overloaded — solid dim-red
    expect(e.status).toBe("Overloaded");
  });
});

describe("encBarStops", () => {
  it("fades between tiers over a window centred on each threshold", () => {
    // ±4% around each threshold: pure colour held to (t-4), ramped to next by (t+4),
    // so the boundary % itself is the 50/50 midpoint of the blend.
    expect(encBarStops({ bands: [25, 37.5, 50], tier: 1 })).toBe(
      "var(--enc-0) 0%, " +
        "var(--enc-0) 21%, var(--enc-1) 29%, " +
        "var(--enc-1) 33.5%, var(--enc-2) 41.5%, " +
        "var(--enc-2) 46%, var(--enc-3) 54%, " +
        "var(--enc-3) 100%",
    );
  });

  it("clamps the fade window to the bar edges", () => {
    // a threshold within 4% of an edge can't overrun 0/100
    expect(encBarStops({ bands: [2, 98], tier: 1 })).toBe(
      "var(--enc-0) 0%, var(--enc-0) 0%, var(--enc-1) 6%, var(--enc-1) 94%, var(--enc-2) 100%, var(--enc-2) 100%",
    );
  });

  it("paints solid in the current tier's colour when there are no thresholds", () => {
    expect(encBarStops({ bands: [], tier: 2 })).toBe("var(--enc-2) 0 100%");
  });

  it("paints solid in barTier when set (basic-immobile → red), overriding tier", () => {
    expect(encBarStops({ bands: [], tier: 1, barTier: 3 })).toBe("var(--enc-3) 0 100%");
  });

  it("basic's lone significant line reads green below, yellow above (no red mid-bar)", () => {
    const stops = encBarStops({ bands: [50], tier: 0 });
    expect(stops).toBe(
      "var(--enc-0) 0%, var(--enc-0) 46%, var(--enc-1) 54%, var(--enc-1) 100%",
    );
  });

  it("spans the full 4-colour spectrum (enc-3 reachable) across three weight bands", () => {
    // weight/slot pass the system breakpoints as bands; the spectrum must run
    // green→amber→orange→red, i.e. reach enc-3 at the 100% end (not top out at enc-2).
    const stops = encBarStops({ bands: [100 / 3, 200 / 3, 100], tier: 2 });
    expect(stops).toContain("var(--enc-3)");
    expect(stops.endsWith("var(--enc-3) 100%")).toBe(true);
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

describe("selectInventory — treasure filtering", () => {
  it("keeps a treasure-flagged gem OUT of the main list (surfaces in Treasure instead)", () => {
    const vm = selectInventory([
      mk("weapon", "Sword", { weight: 30 }),
      mk("item", "Ruby", { treasure: true, weight: 1, cost: 500, quantity: { value: 2 } }),
    ]);
    expect(vm.items.map((i) => i.name)).toEqual(["Sword"]);
    expect(vm.count).toBe(1);
  });

  it("pulls treasure out of a container too, so it never double-renders", () => {
    const vm = selectInventory([
      mk("container", "Chest", { weight: 100 }, { id: "chest" }),
      mk("item", "Emerald", { treasure: true, weight: 1, cost: 900, containerId: "chest" }, { id: "gem" }),
    ]);
    expect(vm.items.map((i) => i.id)).toEqual(["chest"]);
    expect(vm.items[0].children).toEqual([]);
  });
});

describe("selectTreasure", () => {
  it("lists non-coin treasure with summed value (qty × cost), sorted by name", () => {
    const t = selectTreasure([
      mk("weapon", "Sword", { weight: 30 }), // not treasure → excluded
      mk("item", "Ruby", { treasure: true, weight: 1, cost: 500, quantity: { value: 2 } }),
      mk("item", "Amethyst", { treasure: true, weight: 1, cost: 100, quantity: { value: 3 } }),
      mk("item", "GP", { treasure: true, cost: 1, quantity: { value: 50 } }), // coin → excluded
    ]);
    expect(t.map((x) => x.name)).toEqual(["Amethyst", "Ruby"]);
    expect(t.find((x) => x.name === "Ruby")).toMatchObject({ qty: 2, value: 1000 });
    expect(t.find((x) => x.name === "Amethyst")).toMatchObject({ qty: 3, value: 300 });
  });

  it("falls back to qty 1 for a singleton (nulled quantity)", () => {
    const t = selectTreasure([
      mk("item", "Jewelled crown", { treasure: true, weight: 10, cost: 1000 }),
    ]);
    expect(t[0]).toMatchObject({ qty: 1, value: 1000, monogram: "JC" });
  });

  it("excludes Currency-tagged items even without a denom name", () => {
    const t = selectTreasure([
      mk("item", "Trade bar", { treasure: true, cost: 10, tags: [{ value: "Currency" }] }),
    ]);
    expect(t).toEqual([]);
  });
});

describe("selectWealth", () => {
  it("merges coins (canonical order) then valuables into one tagged row list", () => {
    const w = selectWealth([
      mk("item", "Ruby", { treasure: true, weight: 1, cost: 500, quantity: { value: 2 } }),
      mk("item", "GP", { treasure: true, cost: 1, quantity: { value: 50 } }),
      mk("item", "SP", { treasure: true, cost: 0.1, quantity: { value: 8 } }),
    ]);
    // coins first (pp→cp: gp before sp), valuables last
    expect(w.map((r) => [r.kind, r.name])).toEqual([
      ["coin", "GP"],
      ["coin", "SP"],
      ["treasure", "Ruby"],
    ]);
  });

  it("coin rows carry denom/gpEach and 1-cn weight; valuables carry summed value", () => {
    const w = selectWealth([
      mk("item", "GP", { treasure: true, cost: 1, quantity: { value: 50 } }),
      mk("item", "Ruby", { treasure: true, weight: 1, cost: 500, quantity: { value: 2 } }),
    ]);
    expect(w[0]).toMatchObject({ kind: "coin", denom: "GP", gpEach: 1, qty: 50, weight: 50, value: 50 });
    expect(w[1]).toMatchObject({ kind: "treasure", qty: 2, weight: 1, value: 1000 });
  });
});

describe("sortWealth", () => {
  // GP (152gp), SP (0.8gp), Diamond (3 × 500 = 1500gp) — coins + a gem in one list.
  const rows = selectWealth([
    mk("item", "GP", { treasure: true, cost: 1, quantity: { value: 152 } }),
    mk("item", "SP", { treasure: true, cost: 0.1, quantity: { value: 8 } }),
    mk("item", "Diamond", { treasure: true, weight: 3, cost: 500, quantity: { value: 3 } }),
  ]);

  it("sorts coins and treasure together by value desc — the gem outranks the coins", () => {
    expect(sortWealth(rows, "value", "desc").map((r) => r.name)).toEqual(["Diamond", "GP", "SP"]);
  });

  it("sorts coins and treasure together by name (interleaved, not two groups)", () => {
    expect(sortWealth(rows, "item", "asc").map((r) => r.name)).toEqual(["Diamond", "GP", "SP"]);
  });

  it("sorts by qty across kinds", () => {
    // qty: Diamond 3, SP 8, GP 152
    expect(sortWealth(rows, "qty", "asc").map((r) => r.name)).toEqual(["Diamond", "SP", "GP"]);
  });

  it("manual is a passthrough of selectWealth's order (coins first, then gems)", () => {
    expect(sortWealth(rows, "manual", "asc")).toBe(rows);
    expect(rows.map((r) => r.name)).toEqual(["GP", "SP", "Diamond"]);
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
