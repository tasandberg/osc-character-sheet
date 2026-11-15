// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AbilityPlaques } from "@features/actions/AbilityPlaques";
import { HeaderBand } from "@layout/HeaderBand";
import { Identity } from "@layout/Identity";
import type { AbilityVM, IdentityVM, VitalsVM } from "@domain/vm-types";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const abilities: AbilityVM[] = [
  {
    key: "str",
    label: "STR",
    nameKey: "OSE.scores.str.long",
    value: 9,
    mod: 0,
    modLabel: "+0",
    details: [{ labelKey: "OSE.exploration.od.long", value: "2 in 6" }],
  },
];
const strings: Record<string, string> = {
  "OSE.scores.str.long": "Strength",
  "OSE.exploration.od.long": "Open Doors",
};
const identity: IdentityVM = {
  name: "Kip",
  img: "",
  classLabel: "Fighter",
  classLevels: "Fighter 1",
  level: 1,
  alignment: "Lawful",
  title: "Veteran",
  isRetainer: false,
  wage: "",
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as { game?: unknown }).game = {
    i18n: { localize: (k: string) => strings[k] ?? k },
  };
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const abilityGrid = () =>
  container.querySelector<HTMLElement>(".osc-abilities")!;

describe("AbilityPlaques", () => {
  it("renders one plaque per ability and nothing else", () => {
    act(() => root.render(<AbilityPlaques abilities={abilities} />));
    expect(abilityGrid().children.length).toBe(abilities.length);
    expect(container.querySelector('[data-testid="loyalty"]')).toBeNull();
  });

  it("rolls the check from the label and describes the mod's effects", () => {
    const rolled: string[] = [];
    act(() =>
      root.render(
        <AbilityPlaques
          abilities={abilities}
          onRoll={(key) => rolled.push(key)}
        />,
      ),
    );
    const roll = container.querySelector<HTMLElement>(
      '[aria-label="Roll Strength check"]',
    )!;
    act(() => roll.click());
    expect(rolled).toEqual(["str"]);
    expect(container.querySelector('[role="tooltip"]')!.textContent).toContain(
      "Open Doors2 in 6",
    );
  });

  it("derives the score from its base and adjustments in the mod tooltip", () => {
    act(() =>
      root.render(
        <AbilityPlaques
          abilities={[
            {
              ...abilities[0],
              breakdown: {
                base: 7,
                contributions: [
                  { id: "belt", name: "Belt", type: "add", amount: "+2" },
                ],
              },
            },
          ]}
        />,
      ),
    );
    expect(container.querySelector('[role="tooltip"]')!.textContent).toContain(
      "OSC.scores.Base7Belt+2",
    );
  });

  it("opens the score's breakdown from its value", () => {
    const opened: string[] = [];
    act(() =>
      root.render(
        <AbilityPlaques
          abilities={abilities}
          onOpen={(key) => opened.push(key)}
        />,
      ),
    );
    const value = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Strength breakdown"]',
    )!;
    expect(value.textContent).toBe("9");
    act(() => value.click());
    expect(opened).toEqual(["str"]);
  });
});

describe("Identity standing line", () => {
  it("shows the title for a normal character", () => {
    act(() => root.render(<Identity identity={identity} />));
    expect(container.textContent).toContain("Veteran · Lawful");
  });

  it("keeps the title, not the wage, for a retainer", () => {
    act(() =>
      root.render(
        <Identity
          identity={{ ...identity, isRetainer: true, wage: "5gp/month" }}
        />,
      ),
    );
    expect(container.textContent).toContain("Veteran · Lawful");
    expect(container.textContent).not.toContain("Wage");
  });

  it("drops the slot entirely when there is no title", () => {
    act(() => root.render(<Identity identity={{ ...identity, title: "" }} />));
    expect(container.textContent).toContain("Fighter 1 · Lawful");
  });
});

describe("HeaderBand max HP", () => {
  const vitals: VitalsVM = {
    hp: { value: 5, max: 12 },
    ac: { value: 7, ascending: false },
    moveBands: { encounter: 40, explore: 120, travel: 24 },
  };

  it("edits the stored max, not the effect-adjusted one", () => {
    const committed: number[] = [];
    act(() =>
      root.render(
        <HeaderBand
          identity={identity}
          vitals={vitals}
          baseMaxHp={10}
          onSetMaxHp={(n) => committed.push(n)}
        />,
      ),
    );
    act(() =>
      container
        .querySelector<HTMLElement>('[aria-label="Edit Max HP"]')!
        .click(),
    );
    const field = container.querySelector<HTMLElement>('[role="textbox"]')!;
    expect(field.textContent).toBe("10");
    act(() => {
      field.textContent = "14";
      field.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });
    expect(committed).toEqual([14]);
  });
});
