// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { RetainerRow } from "@features/actions/RetainerRow";
import type { LoyaltyVM } from "@domain/vm-types";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

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

const row = () => container.querySelector<HTMLElement>(".osc-retainer");
const loyalty = () =>
  container.querySelector<HTMLButtonElement>('[data-testid="loyalty"]');
const wage = () => container.querySelector<HTMLElement>('[data-testid="wage"]');

describe("RetainerRow", () => {
  it("renders nothing at all for a non-retainer", () => {
    act(() => root.render(<RetainerRow retainer={null} />));
    expect(container.innerHTML).toBe("");
  });

  it("renders both stats and no other text for a retainer", () => {
    act(() => root.render(<RetainerRow retainer={retainer} />));
    expect(row()).not.toBeNull();
    expect(row()!.textContent).toBe("Retainer-Loyalty8Wage50");
    expect(loyalty()!.textContent).toBe("8");
    expect(wage()!.textContent).toBe("50");
  });

  it("rolls loyalty on click, forwarding the modifier keys", () => {
    const onRollLoyalty = vi.fn();
    act(() =>
      root.render(
        <RetainerRow retainer={retainer} onRollLoyalty={onRollLoyalty} />,
      ),
    );
    const el = loyalty()!;
    expect(el.tagName).toBe("BUTTON");
    expect(el.disabled).toBe(false);
    expect(el.getAttribute("aria-label")).toBe("Roll Loyalty Rating check");
    expect(el.getAttribute("title")).toBe("Roll Loyalty Rating check");

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

  it("rolls loyalty on keyboard activation of the button", () => {
    const onRollLoyalty = vi.fn();
    act(() =>
      root.render(
        <RetainerRow retainer={retainer} onRollLoyalty={onRollLoyalty} />,
      ),
    );
    const el = loyalty()!;
    expect(el.type).toBe("button");
    act(() => el.click());
    expect(onRollLoyalty).toHaveBeenCalledTimes(1);
  });

  it("shows a placeholder and stays inert when the rating is unset", () => {
    const onRollLoyalty = vi.fn();
    act(() =>
      root.render(
        <RetainerRow
          retainer={{ ...retainer, value: null }}
          onRollLoyalty={onRollLoyalty}
        />,
      ),
    );
    const el = loyalty()!;
    expect(el.textContent).toBe("—");
    expect(el.disabled).toBe(true);
    expect(el.getAttribute("aria-label")).toBeNull();
    expect(el.getAttribute("title")).toBe("Loyalty Rating — not set");

    act(() => {
      el.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });
    expect(onRollLoyalty).not.toHaveBeenCalled();
  });

  it("stays inert for a read-only viewer with no roll handler", () => {
    act(() => root.render(<RetainerRow retainer={retainer} />));
    expect(loyalty()!.disabled).toBe(true);
    expect(loyalty()!.getAttribute("aria-label")).toBeNull();
  });

  it("renders a placeholder for an empty wage", () => {
    act(() =>
      root.render(<RetainerRow retainer={{ ...retainer, wage: "" }} />),
    );
    expect(wage()!.textContent).toBe("—");
  });
});
