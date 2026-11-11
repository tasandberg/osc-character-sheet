// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DetailsBlock } from "@features/abilities/DetailsBlock";

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

const rollButton = () =>
  container.querySelector<HTMLButtonElement>('[aria-label="Roll Hit Dice"]');

describe("DetailsBlock", () => {
  it("shows initiative and hit dice", () => {
    act(() => root.render(<DetailsBlock initMod={1} hitDice="4d4 / 1d8" />));
    expect(container.textContent).toBe("Initiative+1Hit Dice4d4 / 1d8");
  });

  it("rolls hit dice", () => {
    let rolls = 0;
    act(() =>
      root.render(
        <DetailsBlock
          initMod={0}
          hitDice="3d8"
          onRollHitDice={() => rolls++}
        />,
      ),
    );
    act(() => rollButton()!.click());
    expect(rolls).toBe(1);
  });

  it("offers no roll without hit dice or a handler", () => {
    act(() =>
      root.render(
        <DetailsBlock initMod={0} hitDice="" onRollHitDice={() => {}} />,
      ),
    );
    expect(rollButton()).toBeNull();
    expect(container.textContent).toContain("—");
    act(() => root.render(<DetailsBlock initMod={0} hitDice="3d8" />));
    expect(rollButton()).toBeNull();
  });
});
