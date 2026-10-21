// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { OscSheetContext } from "@app/context";
import { InventoryView } from "@features/inventory";
import { selectInventory } from "@features/inventory/inventory";
import { FLAGS, MODULE_ID } from "@domain/flags";
import type { EncumbranceVM } from "@domain/vm-types";
import type { OSEActor, OscSheetContextValue, OseItem } from "@domain/types";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const rations = {
  _id: "rations",
  name: "Iron rations",
  img: "",
  type: "item",
  system: { weight: 1, quantity: { value: 3, max: 7 } },
} as unknown as OseItem;

let container: HTMLDivElement;
let root: Root;
let actor: OSEActor & {
  updateEmbeddedDocuments: ReturnType<typeof vi.fn>;
  setFlag: ReturnType<typeof vi.fn>;
};
const onSetQty = vi.fn();

const button = (label: string) =>
  [...document.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) =>
      b.getAttribute("aria-label") === label || b.textContent?.trim() === label,
  );

function render() {
  const noop = () => {};
  const ctx = {
    actor,
    items: [rations],
    canEdit: true,
  } as unknown as OscSheetContextValue;
  act(() =>
    root.render(
      <OscSheetContext.Provider value={ctx}>
        <InventoryView
          inventory={selectInventory([rations])}
          encumbrance={{ variant: "basic" } as EncumbranceVM}
          wealth={[]}
          onSetCoin={noop}
          onCreate={noop}
          onEquip={noop}
          onOpen={noop}
          onDelete={noop}
          onConsume={noop}
          onSetQty={onSetQty}
          onReorder={noop}
          onReorderEquipped={noop}
          onNest={noop}
          onSend={noop}
        />
      </OscSheetContext.Provider>,
    ),
  );
}

beforeEach(() => {
  (globalThis as { game?: unknown }).game = { time: { worldTime: 90_000 } };
  actor = {
    flags: { [MODULE_ID]: { [FLAGS.lastAteAt]: 3_600 } },
    system: {},
    updateEmbeddedDocuments: vi.fn().mockResolvedValue([]),
    setFlag: vi.fn().mockResolvedValue(undefined),
  } as unknown as typeof actor;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  render();
  act(() => button("Use one Iron rations")!.click());
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  onSetQty.mockReset();
});

describe("eating a ration from the inventory", () => {
  it("opens the eat dialog with the time since the last meal instead of decrementing", () => {
    expect(button("Eat Ration")).toBeDefined();
    expect(document.body.textContent).toContain("1 day since last ration");
    expect(onSetQty).not.toHaveBeenCalled();
  });

  it("Eat Ration consumes one and records the meal", () => {
    act(() => button("Eat Ration")!.click());
    expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith("Item", [
      { _id: "rations", "system.quantity.value": 2 },
    ]);
    expect(actor.setFlag).toHaveBeenCalledWith(
      MODULE_ID,
      FLAGS.lastAteAt,
      90_000,
    );
    expect(button("Eat Ration")).toBeUndefined();
  });

  it("Cancel closes without eating", () => {
    act(() => button("Cancel")!.click());
    expect(button("Eat Ration")).toBeUndefined();
    expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
  });
});
