// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SavesList } from "@features/actions/SavesExploration";
import type { SaveVM } from "@domain/vm-types";
import type { OSEActor } from "@domain/types";
import { selectSaves } from "@features/actions/saves";

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

describe("SavesList derivation", () => {
  it("explains a class-derived save with OSE's breakdown", () => {
    const g = globalThis as Record<string, unknown>;
    g.game = {
      ose: {
        describeDerivation: (_: unknown, f: { saves: Record<string, number> }) => ({
          "saves.death": `Fighter 4: ${f.saves.death} → ${f.saves.death}`,
        }),
      },
    };
    try {
      const save = (value: number) => ({ value });
      const actor = {
        system: {
          derivedFromClasses: true,
          classes: [],
          thac0: { value: 17, bba: 2 },
          saves: {
            death: save(10), wand: save(11), paralysis: save(12), breath: save(13), spell: save(14),
          },
        },
      } as unknown as OSEActor;
      act(() => root.render(<SavesList saves={selectSaves(actor)} onRoll={vi.fn()} />));

      expect(container.querySelector('[role="tooltip"]')!.textContent).toBe("Fighter 4: 10 → 10");
    } finally {
      delete g.game;
    }
  });
});
