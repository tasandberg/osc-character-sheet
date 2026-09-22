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

const loyaltyValue = () =>
  container.querySelector<HTMLElement>('[data-testid="loyalty"]');
const loyaltyRow = () => container.querySelector<HTMLElement>(".osc-loyalty");
const abilityGrid = () =>
  container.querySelector<HTMLElement>(".osc-abilities")!;

describe("AbilityPlaques loyalty", () => {
  it("keeps the ability grid six-up, with no loyalty plaque inside it", () => {
    act(() =>
      root.render(<AbilityPlaques abilities={abilities} loyalty={loyalty} />),
    );
    expect(abilityGrid().children.length).toBe(abilities.length);
    expect(abilityGrid().className).toBe("osc-abilities");
  });

  it("renders no loyalty row for a non-retainer", () => {
    act(() => root.render(<AbilityPlaques abilities={abilities} />));
    expect(loyaltyRow()).toBeNull();
    expect(loyaltyValue()).toBeNull();
  });

  it("renders a rollable loyalty row below the grid for a retainer", () => {
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

    const row = loyaltyRow()!;
    const el = loyaltyValue()!;
    expect(row.textContent).toBe("Loyalty Rating:8");
    expect(el.textContent).toBe("8");
    expect(el.getAttribute("role")).toBe("button");
    expect(el.getAttribute("aria-label")).toBe("Roll Loyalty Rating check");
    expect(
      abilityGrid().compareDocumentPosition(row) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(abilityGrid().contains(row)).toBe(false);

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
    const el = loyaltyValue()!;
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
    const el = loyaltyValue()!;
    expect(el.textContent).toBe("—");
    expect(el.getAttribute("role")).toBeNull();
    expect(el.className).not.toContain("rollable");
    expect(el.getAttribute("title")).toBe("Loyalty Rating — not set");

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
    expect(loyaltyValue()!.getAttribute("role")).toBeNull();
    expect(loyaltyValue()!.className).not.toContain("rollable");
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
