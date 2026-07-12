// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AttacksTable } from "@features/actions/AttacksTable";
import type { AttackVM } from "@domain/vm-types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const dagger: AttackVM = {
  id: "dagger",
  itemId: "dagger",
  name: "Dagger",
  img: "",
  modes: [
    {
      kind: "melee",
      kindLabel: "Melee",
      hit: { label: "Dagger", formula: "1d20+1", flavor: "hit" },
      hitDisplay: "+1",
      hitTip: "d20+1",
      dmg: { label: "Dagger", formula: "1d4", flavor: "damage" },
      dmgDisplay: "1d4",
      dmgTip: "1d4",
    },
  ],
  qualities: [],
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

describe("AttacksTable", () => {
  it("passes the click event to onAttack (ctrl-click)", () => {
    const onAttack = vi.fn();
    act(() => root.render(<AttacksTable attacks={[dagger]} onAttack={onAttack} />));

    const btn = container.querySelector<HTMLButtonElement>(
      '[data-testid="weapon-attack-dagger"]',
    )!;
    act(() => {
      btn.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true }),
      );
    });

    expect(onAttack).toHaveBeenCalledTimes(1);
    const [itemId, event] = onAttack.mock.calls[0];
    expect(itemId).toBe("dagger");
    expect(event.ctrlKey).toBe(true);
  });
});
