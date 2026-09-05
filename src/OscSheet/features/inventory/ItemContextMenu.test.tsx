// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ItemContextMenu } from "@features/inventory/ItemContextMenu";
import {
  ITEM_CONTEXT_MENU,
  type ItemContextMenuHookArgs,
} from "@domain/extensions";
import type { OSEActor, OseItem } from "@domain/types";
import type { MenuState } from "@features/inventory/types";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const actor = { id: "actor-1" } as unknown as OSEActor;
const doc = { _id: "item-1", name: "Rope" } as unknown as OseItem;
const menu: MenuState = {
  item: {
    id: "item-1",
    name: "Rope",
    equipped: false,
    quantity: { value: 1, max: 0 },
  },
  x: 10,
  y: 10,
};
const noop = () => {};

function stubHooks(listener: (args: ItemContextMenuHookArgs) => void) {
  (globalThis as { Hooks?: unknown }).Hooks = {
    callAll: (hook: string, args: ItemContextMenuHookArgs) => {
      if (hook === ITEM_CONTEXT_MENU) listener(args);
    },
  };
}

let container: HTMLDivElement;
let root: Root;

const render = (node: React.ReactNode) => act(() => root.render(node));

const labels = () =>
  [...container.querySelectorAll(".osc-ctx-item")].map((el) =>
    el.textContent?.trim(),
  );

beforeEach(() => {
  container = document.createElement("div");
  container.className = "osc-inv";
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete (globalThis as { Hooks?: unknown }).Hooks;
});

describe("ItemContextMenu module entries", () => {
  it("renders module entries between Consume and Delete", () => {
    stubHooks(({ entries }) =>
      entries.push({ label: "Send to Party Chest", onClick: noop }),
    );
    render(
      <ItemContextMenu
        menu={menu}
        actor={actor}
        doc={doc}
        canEdit
        onClose={noop}
        onOpen={noop}
        onEquip={noop}
        onConsume={noop}
        onDelete={noop}
      />,
    );
    const found = labels();
    expect(found).toContain("Send to Party Chest");
    expect(found.indexOf("Send to Party Chest")).toBeGreaterThan(
      found.indexOf("Consume one"),
    );
    expect(found.indexOf("Send to Party Chest")).toBeLessThan(
      found.indexOf("Delete Item"),
    );
  });

  it("passes the item document and actor to the callback, then closes", () => {
    const seen: unknown[] = [];
    let closed = false;
    stubHooks(({ entries }) =>
      entries.push({
        label: "Mark as Wares",
        onClick: (item, a) => seen.push(item, a),
      }),
    );
    render(
      <ItemContextMenu
        menu={menu}
        actor={actor}
        doc={doc}
        canEdit
        onClose={() => {
          closed = true;
        }}
        onOpen={noop}
        onEquip={noop}
        onConsume={noop}
        onDelete={noop}
      />,
    );
    const button = [...container.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Mark as Wares"),
    );
    act(() =>
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    );
    expect(seen).toEqual([doc, actor]);
    expect(closed).toBe(true);
  });

  it("honours disabled", () => {
    stubHooks(({ entries }) =>
      entries.push({
        label: "Send to Personal Chest",
        onClick: noop,
        disabled: true,
      }),
    );
    render(
      <ItemContextMenu
        menu={menu}
        actor={actor}
        doc={doc}
        canEdit
        onClose={noop}
        onOpen={noop}
        onEquip={noop}
        onConsume={noop}
        onDelete={noop}
      />,
    );
    const button = [...container.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Send to Personal Chest"),
    );
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("renders no extra group without listeners", () => {
    render(
      <ItemContextMenu
        menu={menu}
        actor={actor}
        doc={doc}
        canEdit
        onClose={noop}
        onOpen={noop}
        onEquip={noop}
        onConsume={noop}
        onDelete={noop}
      />,
    );
    expect(container.querySelector(".osc-ctx-ext")).toBeNull();
  });
});
