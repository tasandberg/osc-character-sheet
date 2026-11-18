// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import OscSheetProvider from "@app/OscSheetProvider";
import { WarningsStrip } from "./WarningsStrip";
import { MODULE_ID } from "@domain/flags";
import type { OSEActor } from "@domain/types";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const STRINGS: Record<string, string> = {
  "OSE.warnings.Title": "Warnings",
  "OSE.warnings.Dismiss": "Hide this warning",
  "OSE.warnings.armour":
    "{item} isn't allowed for any of this character's classes.",
  "OSE.warnings.raceClass": "{race} characters can't normally be {cls}.",
};
const g = globalThis as Record<string, unknown>;
g.foundry = { utils: { debounce: (fn: unknown) => fn } };
g.game = {
  system: { id: "ose" },
  user: { isGM: true },
  i18n: {
    localize: (k: string) => STRINGS[k] ?? k,
    format: (k: string, data: Record<string, string>) =>
      (STRINGS[k] ?? k).replace(/\{(\w+)\}/g, (_, n) => data[n]),
  },
};

const plate = {
  id: "plate",
  name: "Plate Mail",
  type: "armor",
  system: {},
  dismissWarning: vi.fn(async () => undefined),
};

const migrationEffect = {
  flags: { ose: { migration: true } },
  sheet: { render: vi.fn() },
  setFlag: vi.fn(async () => undefined),
  deleteDialog: vi.fn(async () => undefined),
};

const fighter = { name: "Fighter", system: { level: 3 } };

const clickButton = (label: string) =>
  act(() =>
    [...container.querySelectorAll("button")]
      .find((b) => b.textContent === label)!
      .click(),
  );

const makeActor = (
  warnings: unknown[],
  { effects = [] as unknown[], classes = [] as unknown[] } = {},
) => ({
  id: "self",
  name: "Test",
  img: "",
  system: { warnings, warningContext: "fighter,halfling", classes },
  items: { contents: [plate] },
  effects,
});

const WARNINGS = [
  {
    key: "armour",
    itemId: "plate",
    message: "OSE.warnings.armour",
    data: { item: "Plate Mail" },
  },
  {
    key: "raceClass",
    itemId: "halfling",
    message: "OSE.warnings.raceClass",
    data: { race: "Halfling", cls: "Magic-User" },
  },
];

let container: HTMLDivElement;
let root: Root;
const connector = { onUpdate: vi.fn(), tearDown: vi.fn() } as never;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = (actor: ReturnType<typeof makeActor>) =>
  act(() =>
    root.render(
      <OscSheetProvider
        initialActor={actor as unknown as OSEActor}
        source={actor as unknown as OSEActor}
        contextConnector={connector}
        canEdit
        canViewFullSheet
      >
        <WarningsStrip />
      </OscSheetProvider>,
    ),
  );

describe("WarningsStrip", () => {
  it("lists each OSE warning message", () => {
    render(makeActor(WARNINGS));
    const lines = [
      ...container.querySelectorAll('[aria-label="Warnings"] li'),
    ].map((li) => li.textContent);
    expect(lines).toEqual([
      "Plate Mail isn't allowed for any of this character's classes.",
      "Halfling characters can't normally be Magic-User.",
    ]);
  });

  it("hides a warning through OSE for the current class context", () => {
    render(makeActor(WARNINGS));
    act(() =>
      container
        .querySelector<HTMLElement>('[aria-label="Hide this warning"]')!
        .click(),
    );
    expect(plate.dismissWarning).toHaveBeenCalledWith(
      "armour",
      "fighter,halfling",
    );
  });

  it("explains migration adjustments for the character's class and level", () => {
    render(makeActor([], { effects: [migrationEffect], classes: [fighter] }));
    expect(container.textContent).toContain(
      "The Migration Adjustments effect was added to preserve this character's non-standard values. Remove it to use the standard values for a level 3 Fighter.",
    );
  });

  it("opens the migration effect for review", () => {
    render(makeActor([], { effects: [migrationEffect], classes: [fighter] }));
    clickButton("Review Effects");
    expect(migrationEffect.sheet.render).toHaveBeenCalledWith(true);
  });

  it("asks Foundry to confirm removing the migration adjustments", () => {
    render(makeActor([], { effects: [migrationEffect], classes: [fighter] }));
    clickButton("Remove");
    expect(migrationEffect.deleteDialog).toHaveBeenCalled();
  });

  it("hides the migration warning once the adjustments are kept", () => {
    const kept = {
      ...migrationEffect,
      flags: { ose: { migration: true }, [MODULE_ID]: { migrationKept: true } },
    };
    render(makeActor([], { effects: [kept], classes: [fighter] }));
    expect(container.textContent).toBe("");
  });

  it("warns that migration adjustments apply twice without a class item", () => {
    render(makeActor([], { effects: [migrationEffect] }));
    expect(container.textContent).toContain("they now apply twice");
  });

  it("renders nothing without warnings", () => {
    render(makeActor([]));
    expect(container.textContent).toBe("");
  });
});
