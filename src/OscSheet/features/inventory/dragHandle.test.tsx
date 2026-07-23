// @vitest-environment jsdom
// Whole-row drag + treasure drag payload:
//  - treasure (coin/valuable) rows must put Foundry item JSON on text/plain (not the
//    `wealth:<idx>` reorder token) so drops land in Item Piles / the hotbar (#100);
//  - the whole item row is the drag initiator (and stays a drop target).
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { OscSheetContext } from "@app/context";
import { useDragReorder } from "@features/inventory/useDragReorder";
import { WealthRow } from "@features/inventory/WealthRow";
import { SortableRow } from "@features/inventory/rows/SortableRow";
import { ROOT } from "@features/inventory/groups";
import type { CoinWealthRow, InventoryItemVM } from "@domain/vm-types";
import type { OscSheetContextValue } from "@domain/types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const coin: CoinWealthRow = {
  kind: "coin", id: "gp", denom: "GP", gpEach: 1, name: "Gold Pieces",
  img: "", monogram: "GP", qty: 5, weight: 5, value: 5,
};

const mkItem = (id: string): InventoryItemVM => ({
  id, name: id, img: "", category: "Gear", categoryRank: 2, damage: "", tags: [],
  monogram: id[0]!, weight: 1, cost: 0, armorClass: null, sort: 100, equippedSort: 100,
  equipped: false, quantity: null, isContainer: false, children: [],
});

const noop = () => {};
const ctx = { canEdit: true } as OscSheetContextValue;

let container: HTMLDivElement;
let root: Root;

const transfer = () => ({
  setData: vi.fn(), setDragImage: vi.fn(), effectAllowed: "", dropEffect: "",
});

// jsdom has no DragEvent; a bubbling Event + a dataTransfer stub drives React's
// synthetic drag handlers.
function fire(el: Element, type: string, dt: ReturnType<typeof transfer>) {
  const e = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(e, "dataTransfer", { value: dt });
  act(() => { el.dispatchEvent(e); });
}

const render = (node: React.ReactNode) =>
  act(() => root.render(<OscSheetContext.Provider value={ctx}>{node}</OscSheetContext.Provider>));

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function WealthHarness({ itemDragData }: { itemDragData: (id: string) => string | undefined }) {
  const dnd = useDragReorder({ enabled: true, onReorder: noop });
  return (
    <WealthRow
      row={coin} index={0} canEdit dnd={dnd} itemDragData={itemDragData}
      inputValue="5" onOpen={noop} onContext={noop}
      onQtyChange={noop} onQtyCommit={noop} onQtyCommitClose={noop}
    />
  );
}

describe("treasure row drag payload (#100)", () => {
  it("writes the Foundry item JSON on text/plain, not the wealth:<idx> token", () => {
    const json = '{"type":"Item","uuid":"Actor.a.Item.gp"}';
    const itemDragData = vi.fn(() => json);
    render(<WealthHarness itemDragData={itemDragData} />);
    const grip = container.querySelector(".osc-inv-drag")!;
    const dt = transfer();
    fire(grip, "dragstart", dt);
    expect(itemDragData).toHaveBeenCalledWith("gp");
    expect(dt.setData).toHaveBeenCalledWith("text/plain", json);
    expect(dt.setData).not.toHaveBeenCalledWith("text/plain", "wealth:0");
  });
});

const onReorder = vi.fn();
function ItemHarness() {
  const dnd = useDragReorder({ enabled: true, onReorder, onNest: noop });
  return (
    <div>
      {[mkItem("a"), mkItem("b")].map((item, i) => (
        <SortableRow
          key={item.id} item={item} index={i} group={ROOT} depth={0}
          dnd={dnd} itemDragData={() => undefined} canEdit
          onEquip={noop} onOpen={noop} onContext={noop} onSetQty={noop}
        />
      ))}
    </div>
  );
}

describe("SortableRow — the whole row is draggable", () => {
  beforeEach(() => onReorder.mockClear());

  it("marks the row draggable, not the grip", () => {
    render(<ItemHarness />);
    const rows = [...container.querySelectorAll(".osc-inv-row")];
    expect(rows[0]!.getAttribute("draggable")).toBe("true");
    expect(rows[0]!.querySelector(".osc-inv-drag")!.getAttribute("draggable")).toBeNull();
  });

  it("a dragstart on the row body initiates the drag; the row also receives the drop", () => {
    render(<ItemHarness />);
    const rows = [...container.querySelectorAll(".osc-inv-row")];
    fire(rows[0]!, "dragstart", transfer());
    fire(rows[1]!, "dragover", transfer());
    fire(rows[1]!, "drop", transfer());
    expect(onReorder).toHaveBeenCalledWith(expect.objectContaining({ group: ROOT, from: 0 }));
  });
});
