// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { StatsTable } from "@features/actions/StatsTable";
import type { LoyaltyVM } from "@domain/vm-types";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
(globalThis as { game?: unknown }).game = {
  i18n: { localize: (k: string) => k, has: () => true },
};

const moveBands = { encounter: 40, explore: 120, travel: 24 };
const retainer: LoyaltyVM = {
  label: "LR",
  fullLabel: "Loyalty Rating",
  value: 8,
  wage: "50",
};

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

const text = (id: string) =>
  container.querySelector(`[data-testid="${id}"]`)?.textContent;
const loyaltyRoll = () =>
  container.querySelector<HTMLButtonElement>('[aria-label="Roll Loyalty"]');

describe("StatsTable", () => {
  it("shows the effect count, including zero", () => {
    const render = (count: number) =>
      act(() =>
        root.render(
          <StatsTable
            moveBands={moveBands}
            onOpenEffects={() => {}}
            effectCount={count}
          />,
        ),
      );
    render(3);
    expect(text("effect-count")).toBe("3");
    render(0);
    expect(text("effect-count")).toBe("0");
  });

  it("rolls hit dice", () => {
    let rolls = 0;
    act(() =>
      root.render(
        <StatsTable
          moveBands={moveBands}
          hitDice="3d8"
          onRollHitDice={() => rolls++}
        />,
      ),
    );
    act(() =>
      container
        .querySelector<HTMLButtonElement>('[aria-label="Roll Hit Dice"]')!
        .click(),
    );
    expect(rolls).toBe(1);
  });

  it("shows loyalty and wage only for a retainer", () => {
    act(() => root.render(<StatsTable moveBands={moveBands} />));
    expect(text("loyalty")).toBeUndefined();
    act(() =>
      root.render(<StatsTable moveBands={moveBands} retainer={retainer} />),
    );
    expect(text("loyalty")).toBe("8");
    expect(text("wage")).toBe("50");
  });

  it("rolls loyalty", () => {
    let rolls = 0;
    act(() =>
      root.render(
        <StatsTable
          moveBands={moveBands}
          retainer={retainer}
          onRollLoyalty={() => rolls++}
        />,
      ),
    );
    act(() => loyaltyRoll()!.click());
    expect(rolls).toBe(1);
  });

  it("offers no roll and shows placeholders when loyalty and wage are unset", () => {
    act(() =>
      root.render(
        <StatsTable
          moveBands={moveBands}
          retainer={{ ...retainer, value: null, wage: "" }}
          onRollLoyalty={() => {}}
        />,
      ),
    );
    expect(loyaltyRoll()).toBeNull();
    expect(text("loyalty")).toBe("—");
    expect(text("wage")).toBe("—");
  });
});
