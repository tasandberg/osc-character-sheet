// @vitest-environment jsdom
// Item-Based Encumbrance display: the load column reads in item slots, and treasure —
// which the system counts globally at 100 to a slot — shows a section total only.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { OscSheetContext } from "@app/context";
import { SortHeaderRow } from "@features/inventory/rows/SortHeaderRow";
import { WealthSection } from "@features/inventory/WealthSection";
import type { OscSheetContextValue } from "@domain/types";
import type { WealthRow } from "@domain/vm-types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const coin = (denom: string, qty: number): WealthRow => ({
  kind: "coin", id: denom.toLowerCase(), denom, gpEach: 1, name: `${denom} coins`,
  img: "", monogram: denom, qty, weight: qty, value: qty,
});

const ctx = { canEdit: true } as OscSheetContextValue;
const noop = () => {};

let container: HTMLDivElement;
let root: Root;

const render = (node: React.ReactNode) =>
  act(() =>
    root.render(<OscSheetContext.Provider value={ctx}>{node}</OscSheetContext.Provider>),
  );

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const sort = { key: "manual", dir: "asc" } as const;

describe("load column header", () => {
  it("reads Slots under itembased and Wt otherwise", () => {
    render(<SortHeaderRow sort={sort} variant="itembased" onSort={noop} />);
    expect(container.querySelector(".osc-inv-th-wt")?.textContent).toContain("Slots");
    render(<SortHeaderRow sort={sort} variant="basic" onSort={noop} />);
    expect(container.querySelector(".osc-inv-th-wt")?.textContent).toContain("Wt");
  });
});

describe("treasure under itembased", () => {
  // 250 coins → 3 slots (ceil), and no per-row figure to show.
  const wealth = [coin("GP", 150), coin("SP", 100)];

  const openTable = () =>
    act(() => container.querySelector<HTMLButtonElement>('[data-testid="wealth-toggle"]')!.click());

  it("section header totals slots; rows carry a dash", () => {
    render(<WealthSection wealth={wealth} variant="itembased" onSetCoin={noop} itemDragData={() => undefined} onOpen={noop} onContext={noop} />);
    expect(container.querySelector(".osc-whead .wt")?.textContent).toBe("3 slots");
    openTable();
    const cells = [...container.querySelectorAll(".osc-coin-wt")].map((n) => n.textContent?.trim());
    expect(cells).toEqual(["—", "—"]);
    expect(container.querySelector(".osc-coin-total .tw")?.textContent).toBe("3");
  });

  it("cn behaviour is unchanged for the other variants", () => {
    render(<WealthSection wealth={wealth} variant="basic" onSetCoin={noop} itemDragData={() => undefined} onOpen={noop} onContext={noop} />);
    expect(container.querySelector(".osc-whead .wt")?.textContent).toBe("250 cn");
    openTable();
    const cells = [...container.querySelectorAll(".osc-coin-wt")].map((n) => n.textContent?.trim());
    expect(cells).toEqual(["150", "100"]);
    expect(container.querySelector(".osc-coin-total .tw")?.textContent).toBe("250");
  });
});
