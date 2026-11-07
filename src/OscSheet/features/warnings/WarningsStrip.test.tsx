// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import OscSheetProvider from "@app/OscSheetProvider";
import { WarningsStrip } from "./WarningsStrip";
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

const makeActor = (warnings: unknown[]) => ({
  id: "self",
  name: "Test",
  img: "",
  system: { warnings, warningContext: "fighter,halfling" },
  items: { contents: [plate] },
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

  it("renders nothing without warnings", () => {
    render(makeActor([]));
    expect(container.textContent).toBe("");
  });
});
