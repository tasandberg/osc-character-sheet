// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Pips } from "@ui/Pips";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

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

describe("Pips", () => {
  it("renders display-only dots when no handler is given", () => {
    act(() => root.render(<Pips total={3} filled={2} />));
    expect(container.querySelectorAll("button")).toHaveLength(0);
    expect(container.querySelectorAll(".pip")).toHaveLength(3);
    expect(container.querySelectorAll(".pip.filled")).toHaveLength(2);
  });

  it("spends a clicked filled pip and everything right of it", () => {
    const onSetFilled = vi.fn();
    act(() =>
      root.render(<Pips total={4} filled={3} onSetFilled={onSetFilled} />),
    );
    const pips = container.querySelectorAll<HTMLButtonElement>("button.pip");
    expect(pips).toHaveLength(4);
    act(() => pips[1].click());
    expect(onSetFilled).toHaveBeenCalledWith(1);
    act(() => pips[2].click());
    expect(onSetFilled).toHaveBeenCalledWith(2);
  });

  it("restores through a clicked empty pip", () => {
    const onSetFilled = vi.fn();
    act(() =>
      root.render(<Pips total={4} filled={1} onSetFilled={onSetFilled} />),
    );
    const pips = container.querySelectorAll<HTMLButtonElement>("button.pip");
    act(() => pips[3].click());
    expect(onSetFilled).toHaveBeenCalledWith(4);
  });
});
