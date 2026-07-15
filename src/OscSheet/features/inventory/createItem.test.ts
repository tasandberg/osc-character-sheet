import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createItem, INVENTORY_ITEM_TYPES } from "@features/inventory/createItem";
import type { OSEActor } from "@domain/types";

const defaultName = vi.fn(({ type }: { type: string }) => `New ${type}`);

beforeEach(() => {
  (globalThis as { Item?: unknown }).Item = { implementation: { defaultName } };
});
afterEach(() => {
  delete (globalThis as { Item?: unknown }).Item;
  vi.restoreAllMocks();
});

function makeActor(render = vi.fn()) {
  return {
    createEmbeddedDocuments: vi
      .fn()
      .mockResolvedValue([{ sheet: { render } }]),
  } as unknown as OSEActor & { createEmbeddedDocuments: ReturnType<typeof vi.fn> };
}

describe("createItem", () => {
  it("offers exactly the four inventory types (no spell/ability)", () => {
    expect(INVENTORY_ITEM_TYPES).toEqual(["weapon", "armor", "item", "container"]);
  });

  it("creates the embedded item with Foundry's default name", async () => {
    const actor = makeActor();
    await createItem(actor, "container");
    expect(actor.createEmbeddedDocuments).toHaveBeenCalledWith("Item", [
      { type: "container", name: "New container" },
    ]);
  });

  it("opens the new item's sheet so the user can fill it in", async () => {
    const render = vi.fn();
    const actor = makeActor(render);
    await createItem(actor, "weapon");
    expect(render).toHaveBeenCalledWith(true);
  });
});
