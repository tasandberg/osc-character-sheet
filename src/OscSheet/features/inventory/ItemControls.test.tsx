// @vitest-environment jsdom
// OSC-185 spike: can a React-rendered sheet host module-owned DOM?
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { OscSheetContext } from "@app/context";
import { ItemControls } from "@features/inventory/ItemControls";
import {
  INVENTORY_ITEM_CONTROLS,
  type InventoryItemControlsContext,
} from "@domain/extensions";
import type { OSEActor, OscSheetContextValue, OseItem } from "@domain/types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const torch = { _id: "torch", name: "Torch" } as unknown as OseItem;
const actor = { name: "Bree" } as unknown as OSEActor;
const app = { id: "OscSheet-abc" };

let host: HTMLDivElement;
let root: Root;
let listeners: ((c: InventoryItemControlsContext) => void)[];
let seen: InventoryItemControlsContext[];

/** Minimal stand-in for Foundry's Hooks registry. */
function installHooks() {
  (globalThis as { Hooks?: unknown }).Hooks = {
    events: { [INVENTORY_ITEM_CONTROLS]: listeners },
    callAll: (hook: string, context: InventoryItemControlsContext) => {
      if (hook !== INVENTORY_ITEM_CONTROLS) return;
      for (const fn of listeners) fn(context);
    },
  };
}

/** A module: appends one button into the host it is handed. */
const quartermaster = (context: InventoryItemControlsContext) => {
  seen.push(context);
  const button = document.createElement("button");
  button.className = "qm-btn";
  button.textContent = `stow ${context.item.name}`;
  context.controlsElement.append(button);
};

function render(itemId = "torch") {
  const value = {
    actor,
    app,
    items: [torch],
  } as unknown as OscSheetContextValue;
  act(() => {
    root.render(
      // A wrapper row so `rowElement` has something to resolve to.
      <OscSheetContext.Provider value={value}>
        <div className="osc-inv-row">
          <ItemControls itemId={itemId} />
        </div>
      </OscSheetContext.Provider>,
    );
  });
}

const buttons = () => host.querySelectorAll(".osc-inv-controls .qm-btn");

beforeEach(() => {
  listeners = [];
  seen = [];
  installHooks();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  delete (globalThis as { Hooks?: unknown }).Hooks;
  vi.restoreAllMocks();
});

describe("inventory row extension point", () => {
  it("hands the listener the sheet, actor, item, row and its own host", () => {
    listeners.push(quartermaster);
    render();
    expect(seen).toHaveLength(1);
    const context = seen[0];
    expect(context.sheet).toBe(app);
    expect(context.actor).toBe(actor);
    expect(context.item).toBe(torch);
    expect(context.rowElement?.className).toBe("osc-inv-row");
    expect(context.controlsElement.className).toBe("osc-inv-controls");
  });

  it("keeps module-owned DOM across a React re-render", () => {
    listeners.push(quartermaster);
    render();
    expect(buttons()).toHaveLength(1);
    render();
    render();
    // Re-fired each commit, but cleared first — so it never stacks duplicates.
    expect(buttons()).toHaveLength(1);
    expect(buttons()[0].textContent).toBe("stow Torch");
  });

  it("renders an inert empty host when no module listens", () => {
    render();
    expect(seen).toHaveLength(0);
    expect(host.querySelector(".osc-inv-controls")?.childNodes).toHaveLength(0);
  });

  it("clears the host on unmount so listeners leak no nodes", () => {
    listeners.push(quartermaster);
    render();
    const slot = host.querySelector(".osc-inv-controls")!;
    act(() => root.unmount());
    expect(slot.childNodes).toHaveLength(0);
    root = createRoot(host);
  });
});
