import { describe, it, expect, afterEach } from "vitest";
import {
  ITEM_CONTEXT_MENU,
  collectItemMenuEntries,
  type ItemContextMenuHookArgs,
  type ItemMenuEntry,
} from "@domain/extensions";
import type { OSEActor, OseItem } from "@domain/types";

const actor = { id: "actor-1" } as unknown as OSEActor;
const item = { _id: "item-1", name: "Rope" } as unknown as OseItem;

function stubHooks(listener?: (args: ItemContextMenuHookArgs) => void) {
  (globalThis as { Hooks?: unknown }).Hooks = {
    callAll: (hook: string, args: ItemContextMenuHookArgs) => {
      if (hook === ITEM_CONTEXT_MENU) listener?.(args);
    },
  };
}

const entry = (over: Partial<ItemMenuEntry> = {}): ItemMenuEntry => ({
  label: "Send to Party Chest",
  onClick: () => {},
  ...over,
});

afterEach(() => {
  delete (globalThis as { Hooks?: unknown }).Hooks;
});

describe("collectItemMenuEntries", () => {
  it("returns what listeners push, in order", () => {
    stubHooks((args) => {
      args.entries.push(
        entry({ label: "Wares" }),
        entry({ label: "Favorite" }),
      );
    });
    expect(
      collectItemMenuEntries(actor, item, true).map((e) => e.label),
    ).toEqual(["Wares", "Favorite"]);
  });

  it("hands listeners the actor, item and edit gate", () => {
    let seen: ItemContextMenuHookArgs | undefined;
    stubHooks((args) => {
      seen = args;
    });
    collectItemMenuEntries(actor, item, false);
    expect(seen?.actor).toBe(actor);
    expect(seen?.item).toBe(item);
    expect(seen?.canEdit).toBe(false);
  });

  it("drops malformed entries", () => {
    stubHooks((args) => {
      args.entries.push(
        entry(),
        { label: "no callback" } as unknown as ItemMenuEntry,
        null as unknown as ItemMenuEntry,
      );
    });
    expect(collectItemMenuEntries(actor, item, true)).toHaveLength(1);
  });

  it("is inert with no Hooks global, no listeners, or no item", () => {
    expect(collectItemMenuEntries(actor, item, true)).toEqual([]);
    stubHooks();
    expect(collectItemMenuEntries(actor, item, true)).toEqual([]);
    expect(collectItemMenuEntries(actor, undefined, true)).toEqual([]);
  });
});
