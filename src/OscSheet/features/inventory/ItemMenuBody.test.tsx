// @vitest-environment jsdom
// The module extension point: the item menu fires renderItemMenu with the actor,
// the Foundry item and an empty host element for a module's own controls.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { OscSheetContext } from "@app/context";
import { ItemMenuBody } from "@features/inventory/ItemMenuBody";
import { HOOKS } from "@domain/extensions";
import type { InventoryItemVM } from "@domain/vm-types";
import type { OscSheetContextValue } from "@domain/types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const item = {
  id: "torch",
  name: "Torches",
  equipped: null,
  quantity: { value: 6, max: 6 },
} as InventoryItemVM;

const actor = { name: "Vala" };
const doc = { _id: "torch", name: "Torches" };
const ctx = {
  actor,
  items: [doc],
  canEdit: true,
} as unknown as OscSheetContextValue;

let container: HTMLDivElement;
let root: Root;
const callAll = vi.fn();
const events: Record<string, unknown[]> = {};

const setHooks = () => {
  (globalThis as { foundry?: unknown }).foundry = {
    helpers: { Hooks: { callAll, events } },
  };
};

const render = () =>
  act(() =>
    root.render(
      <OscSheetContext.Provider value={ctx}>
        <ItemMenuBody item={item} vm={item} onClose={() => {}} />
      </OscSheetContext.Provider>,
    ),
  );

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  callAll.mockClear();
  for (const k of Object.keys(events)) delete events[k];
  setHooks();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("item menu extension point", () => {
  it("renders no host and fires nothing when no module is listening", () => {
    render();
    expect(container.querySelector(".osc-item-menu-additions")).toBeNull();
    expect(callAll).not.toHaveBeenCalled();
  });

  it("hands a listening module the actor, the item document and an empty host", () => {
    events[HOOKS.itemMenu] = [() => {}];
    render();
    const host = container.querySelector(".osc-item-menu-additions");
    expect(host).not.toBeNull();
    expect(host?.childElementCount).toBe(0);
    expect(callAll).toHaveBeenCalledWith(
      HOOKS.itemMenu,
      expect.objectContaining({ actor, item: doc, element: host }),
    );
  });

  it("leaves module DOM alone across a re-render", () => {
    events[HOOKS.itemMenu] = [() => {}];
    render();
    const host = container.querySelector(".osc-item-menu-additions");
    const own = document.createElement("div");
    own.className = "qm-control";
    host?.append(own);
    render();
    expect(
      container.querySelector(".osc-item-menu-additions .qm-control"),
    ).not.toBeNull();
  });
});
