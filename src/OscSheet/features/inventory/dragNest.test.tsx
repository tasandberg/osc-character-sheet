// @vitest-environment jsdom
// Drag-to-nest wiring: an item dropped anywhere on a container — header row, a
// child row, or the empty body — must nest into it, open or shut.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { OscSheetContext } from "@app/context";
import { useDragReorder, type NestArgs } from "@features/inventory/useDragReorder";
import { SortableRow } from "@features/inventory/rows/SortableRow";
import { ContainerRow } from "@features/inventory/rows/ContainerRow";
import { indexById, ROOT, EQUIPPED } from "@features/inventory/groups";
import type { InventoryItemVM } from "@domain/vm-types";
import type { OscSheetContextValue } from "@domain/types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const item = (id: string, over: Partial<InventoryItemVM> = {}): InventoryItemVM => ({
  id,
  name: id,
  img: "",
  category: "Gear",
  categoryRank: 2,
  damage: "",
  tags: [],
  monogram: id[0]!,
  weight: 1,
  cost: 0,
  armorClass: null,
  sort: 100,
  equippedSort: 100,
  equipped: false,
  quantity: null,
  isContainer: false,
  children: [],
  ...over,
});

const rope = item("rope");
const arrows = item("arrows");
const sack = item("sack", { isContainer: true, category: "Container", children: [arrows] });
const items = [rope, sack];

let container: HTMLDivElement;
let root: Root;
const onNest = vi.fn<(a: NestArgs) => void>();
const onReorder = vi.fn();

function Harness({ collapsed }: { collapsed: boolean }) {
  const dnd = useDragReorder({ onNest, onReorder });
  const byId = indexById(items);
  const noop = () => {};
  const drag = () => undefined;
  // stand-in for an equipped-tray tile (whole-tile draggable): its drags must never nest
  const tray = dnd.rowProps(EQUIPPED, 0, { axis: "x" });
  return (
    <div>
      <div data-testid="tray" {...tray} />
      <SortableRow
        item={rope}
        index={0}
        group={ROOT}
        depth={0}
        dnd={dnd}
        itemDragData={drag}
        canEdit
        onEquip={noop}
        onOpen={noop}
        onContext={noop}
        onSetQty={noop}
      />
      <ContainerRow
        item={sack}
        index={1}
        childIds={collapsed ? [] : ["arrows"]}
        byId={byId}
        collapsed={collapsed}
        dnd={dnd}
        itemDragData={drag}
        canEdit
        onToggle={noop}
        onEquip={noop}
        onOpen={noop}
        onContext={noop}
        onSetQty={noop}
      />
    </div>
  );
}

const ctx = { canEdit: true } as OscSheetContextValue;

function render(collapsed = false) {
  act(() => {
    root.render(
      <OscSheetContext.Provider value={ctx}>
        <Harness collapsed={collapsed} />
      </OscSheetContext.Provider>,
    );
  });
}

// jsdom has no DragEvent; a bubbling Event with a dataTransfer stub is enough for
// React's synthetic drag handlers.
function fire(el: Element, type: string) {
  const e = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(e, "dataTransfer", {
    value: { setData: () => {}, effectAllowed: "", dropEffect: "" },
  });
  act(() => {
    el.dispatchEvent(e);
  });
}

// The grip (.osc-inv-drag) is the drag initiator; a tray tile is draggable whole,
// so fall back to the element itself when it has no grip.
function dragOnto(source: Element, target: Element) {
  const handle = source.querySelector(".osc-inv-drag") ?? source;
  fire(handle, "dragstart");
  fire(target, "dragover");
  fire(target, "drop");
}

const rows = () => [...container.querySelectorAll(".osc-inv-row")];
const rowFor = (name: string) =>
  rows().find((r) => r.querySelector(".nm")?.textContent === name)!;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  onNest.mockClear();
  onReorder.mockClear();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("drag to nest", () => {
  it("nests an item dropped on an expanded container's child row", () => {
    render(false);
    dragOnto(rowFor("rope"), rowFor("arrows"));
    expect(onNest).toHaveBeenCalledWith({
      fromGroup: ROOT,
      from: 0,
      targetIdx: 0,
      zone: "sack",
    });
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("nests an item dropped on an expanded container's header row", () => {
    render(false);
    dragOnto(rowFor("rope"), rowFor("sack"));
    expect(onNest).toHaveBeenCalledWith({
      fromGroup: ROOT,
      from: 0,
      targetIdx: 1,
      zone: "sack",
    });
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("nests an item dropped on a collapsed container", () => {
    render(true);
    dragOnto(rowFor("rope"), rowFor("sack"));
    expect(onNest).toHaveBeenCalledWith({
      fromGroup: ROOT,
      from: 0,
      targetIdx: 1,
      zone: "sack",
    });
  });

  it("un-nests a child dropped on a root row", () => {
    render(false);
    dragOnto(rowFor("arrows"), rowFor("rope"));
    expect(onNest).toHaveBeenCalledWith(
      expect.objectContaining({ fromGroup: "c:sack", from: 0, zone: null }),
    );
  });

  it("ignores an equipped-tray drag onto a container child (unequip handles it)", () => {
    render(false);
    dragOnto(container.querySelector('[data-testid="tray"]')!, rowFor("arrows"));
    expect(onNest).not.toHaveBeenCalled();
    expect(onReorder).not.toHaveBeenCalled();
  });
});
