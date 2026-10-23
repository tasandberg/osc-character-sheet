// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AttacksTable, type AttackTargeting } from "@features/actions/AttacksTable";
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
      dmgDie: "1d4",
      dmgModDisplay: "+0",
      dmgTip: "1d4",
    },
  ],
  qualities: [],
};

const sling: AttackVM = {
  ...dagger,
  id: "sling",
  itemId: "sling",
  name: "Sling",
  modes: [
    dagger.modes[0],
    { ...dagger.modes[0], kind: "missile", kindLabel: "Missile" },
  ],
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
    const [itemId, kind, event] = onAttack.mock.calls[0];
    expect(itemId).toBe("dagger");
    expect(kind).toBe("melee");
    expect(event.ctrlKey).toBe(true);
  });

  it("passes the active mode's kind (switched to missile)", () => {
    const onAttack = vi.fn();
    act(() => root.render(<AttacksTable attacks={[sling]} onAttack={onAttack} />));

    const click = (testid: string) => {
      const el = container.querySelector<HTMLButtonElement>(`[data-testid="${testid}"]`)!;
      act(() => {
        el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      });
    };

    click("attack-mode-missile-sling");
    click("weapon-attack-sling");

    expect(onAttack.mock.calls[0][1]).toBe("missile");
  });

  describe("targeting", () => {
    const goblin = {
      id: "tok-goblin",
      name: "Goblin",
      img: "goblin.webp",
      hostile: true,
      disposition: "Hostile",
      dispositionKey: "HOSTILE" as const,
    };

    const targeting = (overrides: Partial<AttackTargeting> = {}): AttackTargeting => ({
      listTargets: () => [goblin],
      current: null,
      onTarget: vi.fn(),
      onClearTarget: vi.fn(),
      promptForTarget: false,
      ...overrides,
    });

    const buttonNamed = (name: string) =>
      [...document.querySelectorAll<HTMLButtonElement>("button")].find(
        (b) => (b.getAttribute("aria-label") ?? b.textContent?.trim()) === name,
      );

    const targetOption = (name: string) =>
      [...document.querySelectorAll<HTMLButtonElement>("button[aria-pressed]")].find(
        (b) => b.textContent?.startsWith(name),
      );

    const click = (el: HTMLElement | undefined) =>
      act(() => {
        el!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      });

    const hitButton = () =>
      container.querySelector<HTMLButtonElement>('[data-testid="weapon-hit-dagger"]')!;

    it("opens the target dialog from the header, listing visible tokens", () => {
      act(() => root.render(<AttacksTable attacks={[dagger]} targeting={targeting()} />));

      click(buttonNamed("Target"));

      expect(targetOption("Goblin")).toBeDefined();
    });

    it("says so when no tokens are visible", () => {
      act(() =>
        root.render(
          <AttacksTable attacks={[dagger]} targeting={targeting({ listTargets: () => [] })} />,
        ),
      );

      click(buttonNamed("Target"));

      expect(container.textContent).toContain("No visible tokens");
    });

    it("labels the CTA by whether a target is picked, and targets it", () => {
      const onTarget = vi.fn();
      act(() =>
        root.render(<AttacksTable attacks={[dagger]} targeting={targeting({ onTarget })} />),
      );

      click(buttonNamed("Target"));
      expect(buttonNamed("Roll without target")).toBeDefined();

      click(targetOption("Goblin"));
      click(buttonNamed("Attack Goblin"));

      expect(onTarget).toHaveBeenCalledWith("tok-goblin");
      expect(buttonNamed("Attack Goblin")).toBeUndefined();
    });

    it("shows the current target in the header, with a clear button", () => {
      const onClearTarget = vi.fn();
      act(() =>
        root.render(
          <AttacksTable
            attacks={[dagger]}
            targeting={targeting({ current: goblin, onClearTarget })}
          />,
        ),
      );

      expect(buttonNamed("Target")).toBeUndefined();
      expect(container.textContent).toContain("Goblin");

      click(container.querySelector<HTMLButtonElement>('[aria-label="Clear target"]')!);

      expect(onClearTarget).toHaveBeenCalled();
    });

    it("prompts before rolling when the setting is on and nothing is targeted", () => {
      const onRoll = vi.fn();
      const onTarget = vi.fn();
      act(() =>
        root.render(
          <AttacksTable
            attacks={[dagger]}
            onRoll={onRoll}
            targeting={targeting({ promptForTarget: true, onTarget })}
          />,
        ),
      );

      click(hitButton());
      expect(onRoll).not.toHaveBeenCalled();
      expect(container.textContent).toContain("Choose a target for Dagger hit");
      expect(buttonNamed("Roll Dagger hit without target")).toBeDefined();

      click(targetOption("Goblin"));
      click(buttonNamed("Attack Goblin"));

      expect(onTarget).toHaveBeenCalledWith("tok-goblin");
      expect(onRoll).toHaveBeenCalledWith(dagger.modes[0].hit);
    });

    it("cancelling the prompt aborts the roll", () => {
      const onRoll = vi.fn();
      act(() =>
        root.render(
          <AttacksTable
            attacks={[dagger]}
            onRoll={onRoll}
            targeting={targeting({ promptForTarget: true })}
          />,
        ),
      );

      click(hitButton());
      click(buttonNamed("Cancel"));

      expect(onRoll).not.toHaveBeenCalled();
    });

    it("rolls directly when the setting is off or a target exists", () => {
      const onRoll = vi.fn();
      const render = (t: AttackTargeting) =>
        act(() => root.render(<AttacksTable attacks={[dagger]} onRoll={onRoll} targeting={t} />));

      render(targeting());
      click(hitButton());
      render(targeting({ promptForTarget: true, current: goblin }));
      click(hitButton());

      expect(onRoll).toHaveBeenCalledTimes(2);
      expect(buttonNamed("Roll without target")).toBeUndefined();
    });
  });
});
