// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { UsesRow } from "@features/inventory/rows/UsesRow";
import type { InventoryItemVM } from "@domain/vm-types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
// jsdom has no ResizeObserver; the fit-measure hook needs it to exist (no-op is fine —
// scrollWidth/clientWidth are 0 here, so pips always "fit" and never fall back).
(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const mkItem = (o: Partial<InventoryItemVM> = {}): InventoryItemVM => ({
  id: "arrows", name: "Arrows", img: "", category: "Weapon", categoryRank: 0,
  damage: "", tags: [], monogram: "AR", weight: 5, cost: 0, armorClass: null,
  sort: 0, equippedSort: 0, equipped: null, quantity: { value: 3, max: 5 },
  isContainer: false, children: [], ...o,
});

let container: HTMLDivElement;
let root: Root;
const render = (ui: React.ReactNode) => act(() => root.render(ui));

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const pips = () =>
  Array.from(container.querySelectorAll<HTMLButtonElement>(".osc-inv-pip"));

describe("UsesRow", () => {
  it("renders `max` boxes, `value` of them filled", () => {
    render(<UsesRow item={mkItem()} canEdit onSetQty={() => {}} />);
    const boxes = pips();
    expect(boxes).toHaveLength(5);
    expect(boxes.filter((b) => b.classList.contains("filled"))).toHaveLength(3);
  });

  it("clicking an empty pip sets the count to that pip", () => {
    const onSetQty = vi.fn();
    render(<UsesRow item={mkItem()} canEdit onSetQty={onSetQty} />);
    act(() => pips()[3].click()); // 4th box (n=4), currently empty
    expect(onSetQty).toHaveBeenCalledWith("arrows", 4);
  });

  it("clicking the last filled pip ticks one off", () => {
    const onSetQty = vi.fn();
    render(<UsesRow item={mkItem({ quantity: { value: 3, max: 5 } })} canEdit onSetQty={onSetQty} />);
    act(() => pips()[2].click()); // 3rd box = last filled (n===value) → value-1
    expect(onSetQty).toHaveBeenCalledWith("arrows", 2);
  });

  it("stops at 0 — the last remaining unit ticks off to 0, not below", () => {
    const onSetQty = vi.fn();
    render(<UsesRow item={mkItem({ quantity: { value: 1, max: 5 } })} canEdit onSetQty={onSetQty} />);
    act(() => pips()[0].click()); // only filled box → 0
    expect(onSetQty).toHaveBeenCalledWith("arrows", 0);
  });

  it("read-only renders static pips (no buttons) + a count", () => {
    render(<UsesRow item={mkItem()} canEdit={false} onSetQty={() => {}} />);
    expect(container.querySelectorAll("button.osc-inv-pip")).toHaveLength(0);
    expect(container.querySelectorAll("span.osc-inv-pip")).toHaveLength(5);
    expect(container.querySelector(".osc-inv-uses-count")?.textContent).toBe("3/5");
  });

  it("Use fallback is labelled `Use`, decrements and disables at 0", () => {
    const onSetQty = vi.fn();
    render(<UsesRow item={mkItem({ quantity: { value: 2, max: 24 } })} canEdit onSetQty={onSetQty} />);
    const use1 = container.querySelector<HTMLButtonElement>(".osc-inv-use1")!;
    expect(use1).toBeTruthy();
    expect(use1.textContent).toBe("Use");
    act(() => use1.click());
    expect(onSetQty).toHaveBeenCalledWith("arrows", 1);

    render(<UsesRow item={mkItem({ quantity: { value: 0, max: 24 } })} canEdit onSetQty={onSetQty} />);
    expect(container.querySelector<HTMLButtonElement>(".osc-inv-use1")!.disabled).toBe(true);
  });
});
