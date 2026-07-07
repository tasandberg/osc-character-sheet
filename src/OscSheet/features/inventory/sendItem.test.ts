import { describe, it, expect } from "vitest";
import { collectTree, rebuildNesting, classifyRoute, type SendNode } from "./sendItem";
import { MODULE_ID, FLAGS } from "@domain/flags";
import type { OseItem } from "@domain/types";

type Sys = Record<string, unknown>;

/** Live-item mock: `.toObject()` returns a deep clone of the raw source data. */
const mk = (
  id: string,
  type: string,
  system: Sys = {},
  flags: Record<string, unknown> = {},
): OseItem => {
  const base = {
    _id: id,
    name: id,
    img: "",
    type,
    system: { containerId: "", equipped: false, quantity: { value: 1, max: 0 }, ...system },
    flags,
    effects: [] as unknown[],
  };
  return { ...base, toObject: () => structuredClone(base) } as unknown as OseItem;
};

const sys = (n: SendNode) => n.system as Record<string, unknown>;
const qty = (n: SendNode) => (sys(n).quantity as { value: number }).value;

describe("collectTree — stacked non-container", () => {
  const rations = mk("rat", "item", { quantity: { value: 7, max: 7 } });

  it("partial send: copy carries sent qty, source is decremented", () => {
    const plan = collectTree(rations, [rations], 3);
    expect(plan.create).toHaveLength(1);
    expect(qty(plan.create[0])).toBe(3);
    expect(plan.decrement).toEqual({ id: "rat", value: 4 });
    expect(plan.deleteIds).toEqual([]);
  });

  it("full send: copy carries all, source deleted (no decrement)", () => {
    const plan = collectTree(rations, [rations], 7);
    expect(qty(plan.create[0])).toBe(7);
    expect(plan.deleteIds).toEqual(["rat"]);
    expect(plan.decrement).toBeNull();
  });
});

describe("collectTree — copy hygiene", () => {
  const sword = mk(
    "sw",
    "weapon",
    { quantity: { value: 1, max: 0 }, equipped: true, containerId: "somebag" },
    { [MODULE_ID]: { [FLAGS.order]: 100, [FLAGS.equippedOrder]: 200 }, core: { keep: true } },
  );
  const plan = collectTree(sword, [sword], 1);
  const node = plan.create[0];

  it("non-stacked item is a full move", () => {
    expect(plan.deleteIds).toEqual(["sw"]);
    expect(plan.decrement).toBeNull();
  });

  it("strips _id", () => {
    expect(node._id).toBeUndefined();
  });

  it("clears order/equippedOrder flags but keeps other scopes", () => {
    const f = node.flags as Record<string, Record<string, unknown>>;
    expect(f[MODULE_ID]?.[FLAGS.order]).toBeUndefined();
    expect(f[MODULE_ID]?.[FLAGS.equippedOrder]).toBeUndefined();
    expect(f.core).toEqual({ keep: true });
  });

  it("unequips the copy", () => {
    expect(sys(node).equipped).toBe(false);
  });

  it("clears the root copy's containerId", () => {
    expect(sys(node).containerId).toBe("");
    expect(node._parentKey).toBeNull();
  });
});

describe("collectTree — container with nested contents", () => {
  const bag = mk("bag", "container", {});
  const subBag = mk("sub", "container", { containerId: "bag" });
  const torch = mk("torch", "item", { containerId: "bag" });
  const gem = mk("gem", "treasure", { containerId: "sub" });
  const rope = mk("rope", "item", {}); // top-level — not part of the bag
  const plan = collectTree(bag, [bag, subBag, torch, gem, rope], 1);

  it("gathers the root + all descendants incl sub-containers", () => {
    expect(plan.create.map((n) => n._key).sort()).toEqual(
      ["bag", "gem", "sub", "torch"].sort(),
    );
    expect(plan.deleteIds.sort()).toEqual(["bag", "gem", "sub", "torch"].sort());
  });

  it("records original parent keys for nesting rebuild", () => {
    const by = (k: string) => plan.create.find((n) => n._key === k)!;
    expect(by("bag")._parentKey).toBeNull();
    expect(sys(by("bag")).containerId).toBe("");
    expect(by("torch")._parentKey).toBe("bag");
    expect(by("sub")._parentKey).toBe("bag");
    expect(by("gem")._parentKey).toBe("sub");
  });
});

describe("rebuildNesting", () => {
  it("remaps old→new container ids down a chain (root excluded)", () => {
    const nodes: SendNode[] = [
      { _key: "bag", _parentKey: null, system: {}, flags: {} },
      { _key: "sub", _parentKey: "bag", system: {}, flags: {} },
      { _key: "gem", _parentKey: "sub", system: {}, flags: {} },
    ];
    const idMap = new Map([
      ["bag", "b2"],
      ["sub", "s2"],
      ["gem", "g2"],
    ]);
    expect(rebuildNesting(nodes, idMap)).toEqual([
      { _id: "s2", "system.containerId": "b2" },
      { _id: "g2", "system.containerId": "s2" },
    ]);
  });
});

describe("classifyRoute", () => {
  it("both actors owned by me → local apply", () => {
    expect(classifyRoute({ isOwner: true }, { isOwner: true })).toBe("local");
  });
  it("cross-owner target → GM relay", () => {
    expect(classifyRoute({ isOwner: true }, { isOwner: false })).toBe("gm-relay");
  });
});
