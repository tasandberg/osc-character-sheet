// @vitest-environment jsdom
// The popover must escape its clipping ancestor: an ancestor with `overflow-y: auto`
// computes `overflow-x` as a clip box, so an absolutely-positioned card is cut off at
// the sheet's edge (the equipped-item card lost its whole left half). Both hover
// cards therefore go through HoverPop → `position: fixed`, JS-anchored, clamped to the
// viewport. These tests pin the strategy, not the pixels.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { HoverPop } from "@ui/HoverPop";
import { EquippedTray } from "@features/inventory/EquippedTray";
import { useDragReorder } from "@features/inventory/useDragReorder";
import { MoveTooltip } from "@ui/MovePop";
import type { InventoryItemVM } from "@domain/vm-types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

/** jsdom has no layout: stub the trigger's rect so placement has real numbers. */
function stubRect(el: Element, r: { left: number; width: number; bottom: number }) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    ...r,
    top: r.bottom - 50,
    right: r.left + r.width,
    height: 50,
    x: r.left,
    y: r.bottom - 50,
    toJSON: () => "",
  } as DOMRect);
}

const hover = (el: Element, type: "pointerenter" | "pointerleave") =>
  act(() => {
    el.dispatchEvent(new Event(type, { bubbles: false }));
  });

describe("HoverPop", () => {
  it("is fixed, not absolute, so no overflow ancestor can clip it", () => {
    act(() =>
      root.render(
        <span className="trigger">
          <HoverPop className="pop">body</HoverPop>
        </span>,
      ),
    );
    const trigger = container.querySelector(".trigger")!;
    const pop = container.querySelector<HTMLElement>(".pop")!;

    // closed: laid out but invisible (measurable, so placement is a single pass)
    expect(pop.style.position).toBe("fixed");
    expect(pop.style.visibility).toBe("hidden");

    stubRect(trigger, { left: 200, width: 50, bottom: 100 });
    hover(trigger, "pointerenter");
    expect(pop.style.position).toBe("fixed");
    expect(pop.style.visibility).toBe("");
    expect(pop.style.top).toBe("106px"); // trigger bottom + 6 gap
    expect(pop.style.left).toBe("200px"); // align="start" → trigger's left edge

    hover(trigger, "pointerleave");
    expect(pop.style.visibility).toBe("hidden");
  });

  it("clamps a centred card to the sheet instead of letting it overhang", () => {
    act(() =>
      root.render(
        <span className="trigger">
          <HoverPop className="pop" align="center">
            body
          </HoverPop>
        </span>,
      ),
    );
    const trigger = container.querySelector(".trigger")!;
    const pop = container.querySelector<HTMLElement>(".pop")!;
    // a 200px card centred under the first tile of the equipped tray would start at
    // -75px; clamped it starts at the 8px viewport margin, arrow still on the tile.
    vi.spyOn(pop, "offsetWidth", "get").mockReturnValue(200);
    stubRect(trigger, { left: 0, width: 50, bottom: 120 });

    hover(trigger, "pointerenter");
    expect(pop.style.left).toBe("8px");
    expect(pop.style.getPropertyValue("--anchor-x")).toBe("17px");
  });

  it("clamps inside the sheet window when there is one, not the viewport", () => {
    act(() =>
      root.render(
        <div className="osc-sheet-app">
          <span className="trigger">
            <HoverPop className="pop" align="center">
              body
            </HoverPop>
          </span>
        </div>,
      ),
    );
    const app = container.querySelector(".osc-sheet-app")!;
    const trigger = container.querySelector(".trigger")!;
    const pop = container.querySelector<HTMLElement>(".pop")!;
    vi.spyOn(pop, "offsetWidth", "get").mockReturnValue(200);
    stubRect(app, { left: 400, width: 500, bottom: 600 });
    stubRect(trigger, { left: 420, width: 50, bottom: 120 });

    hover(trigger, "pointerenter");
    expect(pop.style.left).toBe("408px"); // sheet's left edge + 8, not 345
  });
});

const item: InventoryItemVM = {
  id: "sword",
  name: "Sword",
  img: "",
  category: "Weapon",
  categoryRank: 0,
  damage: "1d8",
  tags: [],
  monogram: "S",
  weight: 60,
  cost: 10,
  armorClass: null,
  sort: 100,
  equippedSort: 100,
  equipped: true,
  quantity: null,
  isContainer: false,
  children: [],
};

function Tray() {
  const dnd = useDragReorder();
  return (
    <EquippedTray
      items={[item]}
      dnd={dnd}
      itemDragData={() => undefined}
      onOpen={() => {}}
      onContext={() => {}}
      equipDropActive={false}
      onEquipDrop={() => {}}
    />
  );
}

describe("both hover cards share HoverPop", () => {
  // Same mechanism; only the equipped card draws an arrow, so only it needs a bigger gap.
  it("places both cards off their trigger, the arrowed one clear of it", () => {
    act(() => root.render(<Tray />));
    const equipPop = container.querySelector<HTMLElement>(".osc-equip-tt-pop")!;
    const tile = equipPop.parentElement!;
    expect(tile.className).toContain("osc-equip-tcard");
    expect(equipPop.style.position).toBe("fixed");

    stubRect(tile, { left: 300, width: 50, bottom: 240 });
    hover(tile, "pointerenter");
    expect(equipPop.style.top).toBe("251px"); // 240 + 11

    act(() =>
      root.render(
        <span className="trigger">
          <MoveTooltip bands={{ encounter: 40, explore: 120, travel: 24 }} />
        </span>,
      ),
    );
    const movePop = container.querySelector<HTMLElement>(".osc-move-pop")!;
    const trigger = movePop.parentElement!;
    stubRect(trigger, { left: 300, width: 50, bottom: 240 });
    hover(trigger, "pointerenter");
    expect(movePop.style.top).toBe("246px"); // no arrow → default 6
    expect(movePop.style.position).toBe(equipPop.style.position);
  });
});
