// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AbilityPlaques } from "@features/actions/AbilityPlaques";
import { Identity } from "@layout/Identity";
import type { AbilityVM, IdentityVM, LoyaltyVM } from "@domain/vm-types";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const abilities: AbilityVM[] = [
  { key: "str", label: "STR", value: 9, mod: 0, modLabel: "+0" },
];
const loyalty: LoyaltyVM = {
  label: "LR",
  fullLabel: "Loyalty Rating",
  value: 8,
};
const identity: IdentityVM = {
  name: "Kip",
  img: "",
  classLabel: "Fighter",
  level: 1,
  alignment: "Lawful",
  title: "Veteran",
  isRetainer: false,
  wage: "",
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

const plaque = () =>
  container.querySelector<HTMLElement>('[data-testid="loyalty"]');

describe("AbilityPlaques loyalty", () => {
  it("renders no loyalty plaque for a non-retainer", () => {
    act(() => root.render(<AbilityPlaques abilities={abilities} />));
    expect(plaque()).toBeNull();
    expect(container.querySelector(".osc-abilities")!.className).not.toContain(
      "has-loyalty",
    );
  });

  it("appends a rollable loyalty plaque for a retainer", () => {
    const onRollLoyalty = vi.fn();
    act(() =>
      root.render(
        <AbilityPlaques
          abilities={abilities}
          loyalty={loyalty}
          onRollLoyalty={onRollLoyalty}
        />,
      ),
    );

    const el = plaque()!;
    expect(el.textContent).toContain("LR");
    expect(el.textContent).toContain("8");
    expect(el.getAttribute("role")).toBe("button");
    expect(container.querySelector(".osc-abilities")!.className).toContain(
      "has-loyalty",
    );

    act(() => {
      el.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          ctrlKey: true,
        }),
      );
    });
    expect(onRollLoyalty).toHaveBeenCalledTimes(1);
    expect(onRollLoyalty.mock.calls[0][0].ctrlKey).toBe(true);
  });

  it("rolls on keyboard activation", () => {
    const onRollLoyalty = vi.fn();
    act(() =>
      root.render(
        <AbilityPlaques
          abilities={abilities}
          loyalty={loyalty}
          onRollLoyalty={onRollLoyalty}
        />,
      ),
    );
    const el = plaque()!;
    expect(el.tabIndex).toBe(0);
    act(() => {
      el.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    expect(onRollLoyalty).toHaveBeenCalledTimes(1);
  });

  it("shows a placeholder and stays inert when the rating is unset", () => {
    const onRollLoyalty = vi.fn();
    act(() =>
      root.render(
        <AbilityPlaques
          abilities={abilities}
          loyalty={{ ...loyalty, value: null }}
          onRollLoyalty={onRollLoyalty}
        />,
      ),
    );
    const el = plaque()!;
    expect(el.textContent).toContain("—");
    expect(el.getAttribute("role")).toBeNull();

    act(() => {
      el.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });
    expect(onRollLoyalty).not.toHaveBeenCalled();
  });

  it("stays inert for a read-only viewer with no roll handler", () => {
    act(() =>
      root.render(<AbilityPlaques abilities={abilities} loyalty={loyalty} />),
    );
    expect(plaque()!.getAttribute("role")).toBeNull();
  });
});

describe("Identity standing line", () => {
  it("shows the title for a normal character", () => {
    act(() => root.render(<Identity identity={identity} />));
    expect(container.textContent).toContain("Fighter 1 · Veteran · Lawful");
  });

  it("swaps the title for the wage on a retainer", () => {
    act(() =>
      root.render(
        <Identity
          identity={{ ...identity, isRetainer: true, wage: "5gp/month" }}
        />,
      ),
    );
    expect(container.textContent).toContain(
      "Fighter 1 · Wage 5gp/month · Lawful",
    );
    expect(container.textContent).not.toContain("Veteran");
  });

  it("drops the slot entirely for a retainer with no wage set", () => {
    act(() =>
      root.render(
        <Identity identity={{ ...identity, isRetainer: true, wage: "" }} />,
      ),
    );
    expect(container.textContent).toContain("Fighter 1 · Lawful");
    expect(container.textContent).not.toContain("Veteran");
  });
});
