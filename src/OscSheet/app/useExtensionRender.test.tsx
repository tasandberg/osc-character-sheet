// @vitest-environment jsdom
// OSC-185: modules extend the sheet by re-injecting DOM after every commit.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { OscSheetContext } from "@app/context";
import { useExtensionRender } from "@app/useExtensionRender";
import { SHEET_RENDER, type SheetRenderContext } from "@domain/extensions";
import type { OSEActor, OscSheetContextValue } from "@domain/types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const actor = { name: "Bree" } as unknown as OSEActor;
const app = { id: "OscSheet-abc" };

let host: HTMLDivElement;
let root: Root;
let listeners: ((c: SheetRenderContext) => void)[];
let seen: SheetRenderContext[];
let bump: (n: number) => void;

/** Minimal stand-in for Foundry's Hooks registry. */
function installHooks() {
  (globalThis as { Hooks?: unknown }).Hooks = {
    events: { [SHEET_RENDER]: listeners },
    callAll: (hook: string, context: SheetRenderContext) => {
      if (hook !== SHEET_RENDER) return;
      for (const fn of listeners) fn(context);
    },
  };
}

/** A module: stamps one button onto every inventory row, deduping first. */
const quartermaster = (context: SheetRenderContext) => {
  seen.push(context);
  for (const row of context.element.querySelectorAll<HTMLElement>(
    ".osc-inv-row[data-item-id]",
  )) {
    row.querySelector(":scope > .qm-controls")?.remove();
    const controls = document.createElement("span");
    controls.className = "qm-controls";
    controls.textContent = `stow ${row.dataset.itemId}`;
    row.append(controls);
  }
};

function Sheet() {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  bump = setCount;
  useExtensionRender(ref);
  return (
    <div className="osc-sheet-app" ref={ref}>
      <div className="osc-inv-row" data-item-id="torch">
        <span className="nm">Torch {count}</span>
      </div>
    </div>
  );
}

function render() {
  const value = { actor, app } as unknown as OscSheetContextValue;
  act(() => {
    root.render(
      <OscSheetContext.Provider value={value}>
        <Sheet />
      </OscSheetContext.Provider>,
    );
  });
}

const controls = () => host.querySelectorAll(".osc-inv-row .qm-controls");

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
});

describe("sheet render extension point", () => {
  it("hands the listener the sheet, actor and app root", () => {
    listeners.push(quartermaster);
    render();
    expect(seen).toHaveLength(1);
    expect(seen[0].sheet).toBe(app);
    expect(seen[0].actor).toBe(actor);
    expect(seen[0].element.className).toBe("osc-sheet-app");
  });

  it("lets a module reach a row by its item id", () => {
    listeners.push(quartermaster);
    render();
    expect(controls()).toHaveLength(1);
    expect(controls()[0].textContent).toBe("stow torch");
  });

  it("fires again on re-render so a module can restore its DOM", () => {
    listeners.push(quartermaster);
    render();
    act(() => bump(1));
    expect(seen).toHaveLength(2);
    // Deduped by the module, so its nodes never stack.
    expect(controls()).toHaveLength(1);
  });

  it("stays silent when no module listens", () => {
    render();
    expect(seen).toHaveLength(0);
    expect(controls()).toHaveLength(0);
  });

  it("reaches every listener, not just the first", () => {
    const second: SheetRenderContext[] = [];
    listeners.push(quartermaster, (c) => second.push(c));
    render();
    expect(second).toHaveLength(1);
  });
});
