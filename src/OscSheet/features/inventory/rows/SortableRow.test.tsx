// @vitest-environment jsdom
// The xs inline "Use" pill: rendered on the item row for stacked, editable items
// (a CSS container query swaps it for the pip "Uses" sub-row at wider widths).
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { OscSheetContext } from "@app/context";
import { useDragReorder } from "@features/inventory/useDragReorder";
import { SortableRow } from "@features/inventory/rows/SortableRow";
import { ROOT } from "@features/inventory/groups";
import type { InventoryItemVM } from "@domain/vm-types";
import type { OscSheetContextValue } from "@domain/types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mkItem = (o: Partial<InventoryItemVM> = {}): InventoryItemVM => ({
  id: "arrows", name: "Arrows", img: "", category: "Weapon", categoryRank: 0,
  damage: "", tags: [], monogram: "AR", weight: 5, cost: 0, armorClass: null,
  sort: 0, equippedSort: 0, equipped: null, quantity: { value: 3, max: 5 },
  isContainer: false, children: [], ...o,
});

let container: HTMLDivElement;
let root: Root;
const onSetQty = vi.fn();

function Harness({ item, canEdit }: { item: InventoryItemVM; canEdit: boolean }) {
  const dnd = useDragReorder({ onNest: () => {}, onReorder: () => {} });
  const noop = () => {};
  return (
    <SortableRow
      item={item}
      index={0}
      group={ROOT}
      depth={0}
      dnd={dnd}
      itemDragData={() => undefined}
      canEdit={canEdit}
      onEquip={noop}
      onOpen={noop}
      onContext={noop}
      onSetQty={onSetQty}
    />
  );
}

const ctx = { canEdit: true } as OscSheetContextValue;
const render = (item: InventoryItemVM, canEdit = true) =>
  act(() =>
    root.render(
      <OscSheetContext.Provider value={ctx}>
        <Harness item={item} canEdit={canEdit} />
      </OscSheetContext.Provider>,
    ),
  );

const inlineUse = () =>
  container.querySelector<HTMLButtonElement>(".osc-inv-useinline");

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  onSetQty.mockClear();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("SortableRow inline Use pill", () => {
  it("renders both the pip Uses sub-row and the inline Use pill for a stacked, editable row", () => {
    // The two coexist in the DOM; the xs container query hides one or the other.
    render(mkItem());
    expect(container.querySelector(".osc-inv-uses")).toBeTruthy();
    const pill = inlineUse()!;
    expect(pill).toBeTruthy();
    expect(pill.textContent).toBe("Use");
  });

  it("inline Use decrements by one", () => {
    render(mkItem({ quantity: { value: 3, max: 5 } }));
    act(() => inlineUse()!.click());
    expect(onSetQty).toHaveBeenCalledWith("arrows", 2);
  });

  it("inline Use is disabled at 0", () => {
    render(mkItem({ quantity: { value: 0, max: 5 } }));
    expect(inlineUse()!.disabled).toBe(true);
  });

  it("read-only rows get neither the pip buttons nor an inline Use pill", () => {
    render(mkItem(), false);
    expect(inlineUse()).toBeNull();
    expect(container.querySelectorAll("button.pip")).toHaveLength(0);
  });

  it("non-stacked rows get no Uses sub-row and no inline Use pill", () => {
    render(mkItem({ quantity: null }));
    expect(container.querySelector(".osc-inv-uses")).toBeNull();
    expect(inlineUse()).toBeNull();
  });

  it("WT cell shows the weight with its cn unit", () => {
    render(mkItem({ weight: 15 }));
    expect(container.querySelector(".osc-inv-wt")?.textContent).toBe("15 cn");
  });

  it("WT cell shows an em dash for weightless items", () => {
    render(mkItem({ weight: 0 }));
    expect(container.querySelector(".osc-inv-wt")?.textContent).toBe("—");
  });
});
