// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { InitiativeButton } from "@features/actions/InitiativeButton";

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

describe("InitiativeButton", () => {
  it("shows the initiative modifier and rolls on click", () => {
    let rolls = 0;
    act(() => root.render(<InitiativeButton mod={1} onRoll={() => rolls++} />));
    const button = container.querySelector<HTMLButtonElement>(
      '[aria-label="Roll initiative +1"]',
    )!;
    expect(button.textContent).toBe("Initiative+1");
    act(() => button.click());
    expect(rolls).toBe(1);
  });
});
