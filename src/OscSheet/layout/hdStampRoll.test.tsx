// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import OscSheetApp from "@src/OscSheet";
import { raistlin } from "@src/OscSheet/__fixtures__/raistlin";
import type { OSEActor } from "@domain/types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

(globalThis as { foundry?: unknown }).foundry = {
  utils: { debounce: (fn: unknown) => fn },
  applications: {
    ux: { TextEditor: { enrichHTML: (v: string) => Promise.resolve(v) } },
  },
};
(globalThis as { game?: unknown }).game = {
  i18n: { localize: (k: string) => k },
};
(globalThis as { CONFIG?: unknown }).CONFIG = { OSE: { classes: {} } };
(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

let container: HTMLDivElement;
let root: Root;

const connector = {
  onUpdate: () => {},
  tearDown: vi.fn(),
} as never;

const rollHitDice = vi.fn();
const rollInitiative = vi.fn();

function makeActor(hd = "3d4") {
  const { system, ...rest } = raistlin;
  return {
    ...rest,
    system: {
      ...system,
      spells: { enabled: false },
      hp: { ...system.hp, hd },
    },
    items: { contents: [] },
    update: vi.fn().mockResolvedValue(undefined),
    rollHitDice,
    rollInitiative,
  } as unknown as OSEActor;
}

function mount(isEditable: boolean, hd?: string) {
  const actor = makeActor(hd);
  act(() =>
    root.render(
      <OscSheetApp
        actor={actor}
        source={actor}
        contextConnector={connector}
        isEditable={isEditable}
        canViewFullSheet
      />,
    ),
  );
}

const hdRoll = () =>
  container.querySelector<HTMLElement>('[aria-label="OSE.roll.hd"]');
const stampLabelled = (text: string) =>
  [...container.querySelectorAll<HTMLElement>("*")].find(
    (el) => el.children.length === 0 && el.textContent === text,
  );

beforeEach(() => {
  rollHitDice.mockClear();
  rollInitiative.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("HD roll", () => {
  it("delegates a click to actor.rollHitDice", () => {
    mount(true);
    act(() => hdRoll()!.click());
    expect(rollHitDice).toHaveBeenCalledTimes(1);
    expect(rollHitDice.mock.calls[0][0]).toHaveProperty("event");
  });

  it("rolls on Enter and Space", () => {
    mount(true);
    for (const key of ["Enter", " "])
      act(() =>
        hdRoll()!.dispatchEvent(
          new KeyboardEvent("keydown", { key, bubbles: true }),
        ),
      );
    expect(rollHitDice).toHaveBeenCalledTimes(2);
  });

  it("is announced as a button and reachable by keyboard", () => {
    mount(true);
    const roll = hdRoll()!;
    expect(roll.getAttribute("role")).toBe("button");
    expect(roll.tabIndex).toBe(0);
  });

  it("rolls initiative from INIT", () => {
    mount(true);
    act(() => stampLabelled("INIT")!.click());
    expect(rollInitiative).toHaveBeenCalledTimes(1);
  });

  it("leaves MOVE inert", () => {
    mount(true);
    expect(stampLabelled("MOVE")!.getAttribute("role")).toBeNull();
  });

  it("offers no roll to a viewer without permission", () => {
    mount(false);
    expect(hdRoll()).toBeNull();
    act(() => stampLabelled("HD")!.click());
    expect(rollHitDice).not.toHaveBeenCalled();
  });

  it("offers no roll when the actor has no hit dice", () => {
    mount(true, "");
    expect(hdRoll()).toBeNull();
    act(() => stampLabelled("HD")!.click());
    expect(rollHitDice).not.toHaveBeenCalled();
  });
});
