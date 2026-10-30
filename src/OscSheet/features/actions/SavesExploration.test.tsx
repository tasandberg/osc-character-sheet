// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SavesList } from "@features/actions/SavesExploration";
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

describe("SavesList", () => {
  it("passes the click event to onRoll (ctrl-click)", () => {
    const onRoll = vi.fn();
    act(() => root.render(<SavesList saves={saves} onRoll={onRoll} />));

    const button = container.querySelector<HTMLButtonElement>('button[aria-label^="Roll Death save"]')!;
    act(() => {
      button.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true }),
      );
    });

    expect(onRoll).toHaveBeenCalledTimes(1);
    const [key, event] = onRoll.mock.calls[0];
    expect(key).toBe("death");
    expect(event.ctrlKey).toBe(true);
  });
});
