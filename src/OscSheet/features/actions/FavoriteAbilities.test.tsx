// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { FavoriteAbilities } from "@features/actions/FavoriteAbilities";
import type { FeatureVM } from "@features/abilities/features";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function feature(partial: Partial<FeatureVM> = {}): FeatureVM {
  return {
    id: "hide",
    name: "Hide in Shadows",
    img: "",
    description: "",
    rollable: true,
    rollTag: "1d6 ≤2",
    rollFormula: "1d6",
    rollTargetTag: "≤2",
    favorite: true,
    onRoll: vi.fn(),
    onActivate: vi.fn(),
    onToggleFavorite: vi.fn(),
    onOpen: vi.fn(),
    onDelete: vi.fn(),
    ...partial,
  };
}

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

const click = (testid: string) => {
  const el = container.querySelector<HTMLElement>(`[data-testid="${testid}"]`)!;
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
};

describe("FavoriteAbilities", () => {
  it("renders nothing when there are no favorites", () => {
    act(() => root.render(<FavoriteAbilities features={[]} />));
    expect(container.innerHTML).toBe("");
  });

  it("shows the formula by the dice and the target beside the name", () => {
    act(() =>
      root.render(
        <FavoriteAbilities
          features={[
            feature(),
            feature({ id: "listen", name: "Listen", rollFormula: "1d6", rollTargetTag: "≤1" }),
          ]}
        />,
      ),
    );
    expect(container.querySelectorAll("[data-testid^='fav-ability-']").length).toBeGreaterThan(0);
    expect(container.querySelector('[data-testid="fav-ability-name-hide"]')!.textContent).toBe(
      "Hide in Shadows",
    );
    expect(container.querySelector('[data-testid="fav-ability-target-hide"]')!.textContent).toBe(
      "≤2",
    );
    expect(container.querySelector('[data-testid="fav-ability-roll-listen"]')!.textContent).toContain(
      "1d6",
    );
    expect(container.querySelector('[data-testid="fav-ability-roll-listen"]')!.textContent).not.toContain(
      "≤1",
    );
  });

  it("labels a passive ability's button for chat", () => {
    act(() =>
      root.render(
        <FavoriteAbilities
          features={[feature({ id: "magic", name: "Read Magic", rollable: false, rollTag: undefined, rollFormula: undefined, rollTargetTag: undefined, onRoll: undefined })]}
        />,
      ),
    );
    const btn = container.querySelector('[data-testid="fav-ability-roll-magic"]')!;
    expect(btn.textContent).toContain("chat");
    const row = container.querySelector('[data-testid="fav-ability-magic"]')!;
    expect(row.getAttribute("title")).toBe("Print Read Magic to chat");
  });

  it("the roll button calls onActivate for both rollable and passive abilities", () => {
    const rollable = feature();
    const passive = feature({
      id: "magic",
      name: "Read Magic",
      rollable: false,
      rollTag: undefined,
      onRoll: undefined,
    });
    act(() => root.render(<FavoriteAbilities features={[rollable, passive]} />));

    click("fav-ability-roll-hide");
    click("fav-ability-roll-magic");

    expect(rollable.onActivate).toHaveBeenCalledOnce();
    expect(passive.onActivate).toHaveBeenCalledOnce();
  });

  it("the name opens the item sheet", () => {
    const vm = feature();
    act(() => root.render(<FavoriteAbilities features={[vm]} />));

    click("fav-ability-name-hide");

    expect(vm.onOpen).toHaveBeenCalledOnce();
  });

  it("has no favorite star", () => {
    act(() => root.render(<FavoriteAbilities features={[feature()]} />));
    expect(container.querySelector('[data-testid="fav-ability-star-hide"]')).toBeNull();
  });
});
