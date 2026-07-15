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

const pips = () => Array.from(container.querySelectorAll<HTMLElement>(".pip"));
const strip = () =>
  container.querySelector<HTMLButtonElement>(".osc-inv-usebtn");

describe("UsesRow", () => {
  it("renders `max` boxes, `value` of them filled (display-only spans)", () => {
    render(<UsesRow item={mkItem()} canEdit onSetQty={() => {}} />);
    const boxes = pips();
    expect(boxes).toHaveLength(5);
    expect(boxes.filter((b) => b.classList.contains("filled"))).toHaveLength(3);
    expect(container.querySelectorAll("button.pip")).toHaveLength(0);
  });

  it("clicking anywhere on the pip strip consumes one (quantity − 1)", () => {
    const onSetQty = vi.fn();
    render(<UsesRow item={mkItem({ quantity: { value: 3, max: 5 } })} canEdit onSetQty={onSetQty} />);
    act(() => strip()!.click());
    expect(onSetQty).toHaveBeenCalledWith("arrows", 2);
  });

  it("last remaining unit decrements to 0, not below", () => {
    const onSetQty = vi.fn();
    render(<UsesRow item={mkItem({ quantity: { value: 1, max: 5 } })} canEdit onSetQty={onSetQty} />);
    act(() => strip()!.click());
    expect(onSetQty).toHaveBeenCalledWith("arrows", 0);
  });

  it("at 0 the strip button is disabled — a click is a no-op", () => {
    const onSetQty = vi.fn();
    render(<UsesRow item={mkItem({ quantity: { value: 0, max: 5 } })} canEdit onSetQty={onSetQty} />);
    expect(strip()!.disabled).toBe(true);
    act(() => strip()!.click());
    expect(onSetQty).not.toHaveBeenCalled();
  });

  it("read-only renders static pips (no strip button) + a count", () => {
    render(<UsesRow item={mkItem()} canEdit={false} onSetQty={() => {}} />);
    expect(strip()).toBeNull();
    expect(container.querySelectorAll("span.pip")).toHaveLength(5);
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
