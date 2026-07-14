// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SavesGrid } from "@features/actions/SavesExploration";
import type { SaveVM } from "@domain/vm-types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const saves: SaveVM[] = [{ key: "death", label: "Death", icon: "", target: 12 }];

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

describe("SavesGrid", () => {
  it("passes the click event to onRoll (ctrl-click)", () => {
    const onRoll = vi.fn();
    act(() => root.render(<SavesGrid saves={saves} onRoll={onRoll} />));

    const plaque = container.querySelector<HTMLDivElement>('[data-testid="save-death"]')!;
    act(() => {
      plaque.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true }),
      );
    });

    expect(onRoll).toHaveBeenCalledTimes(1);
    const [key, event] = onRoll.mock.calls[0];
    expect(key).toBe("death");
    expect(event.ctrlKey).toBe(true);
  });
});
