// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import OscSheetApp from "@src/OscSheet";
import { raistlin } from "@src/OscSheet/__fixtures__/raistlin";
import type { OSEActor, OscContext } from "@domain/types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

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
let publish: (ctx: OscContext) => void;

const connector = {
  onUpdate: (cb: (ctx: OscContext) => void) => (publish = cb),
  tearDown: vi.fn(),
} as never;

function makeActor(over: Record<string, unknown> = {}) {
  const { system, ...rest } = raistlin;
  return {
    ...rest,
    system: {
      ...system,
      spells: { enabled: false },
      details: { ...system.details, biography: "A frail red-robed mage." },
    },
    items: { contents: [] },
    update: vi.fn().mockResolvedValue(undefined),
    ...over,
  } as unknown as OSEActor;
}

function mount(props: Record<string, unknown>) {
  const actor = makeActor(
    (props.actorOver as Record<string, unknown>) ?? {},
  );
  act(() =>
    root.render(
      <OscSheetApp
        actor={actor}
        source={actor}
        contextConnector={connector}
        isEditable={false}
        canViewFullSheet={props.canViewFullSheet as boolean | undefined}
      />,
    ),
  );
}

const text = () => container.textContent ?? "";
const hasFullSheet = () => !!container.querySelector(".osc-frame, .osc-topbar");
const hasLimitedSheet = () =>
  !!container.querySelector(".osc-sheet-app.is-limited");
const hasTabs = () =>
  !!container.querySelector(".osc-tabrail, .osc-htabs, .osc-bottombar");

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("LIMITED ownership", () => {
  it("renders the biography-only view when canViewFullSheet is false", () => {
    mount({ canViewFullSheet: false });
    expect(hasLimitedSheet()).toBe(true);
    expect(hasFullSheet()).toBe(false);
  });

  it("shows name and biography, and leaks nothing else", () => {
    mount({ canViewFullSheet: false });
    const body = text();
    expect(body).toContain("Raistlin Majere");
    expect(body).toContain("Biography");
    expect(body).not.toContain("Magic-User");
    expect(body).not.toContain("Conjurer");
    expect(body).not.toContain("Notes");
    expect(body).not.toContain("6420");
    for (const label of ["STR", "INT", "WIS", "DEX", "CON", "CHA", "AC", "HP"])
      expect(body).not.toContain(label);
  });

  it("renders no tab surfaces", () => {
    mount({ canViewFullSheet: false });
    expect(hasTabs()).toBe(false);
  });

  it("renders the full sheet when canViewFullSheet is true", () => {
    mount({ canViewFullSheet: true });
    expect(hasLimitedSheet()).toBe(false);
    expect(hasFullSheet()).toBe(true);
  });

  it("falls back to document.limited=true when the flag is absent", () => {
    mount({ actorOver: { limited: true } });
    expect(hasLimitedSheet()).toBe(true);
    expect(hasFullSheet()).toBe(false);
  });

  it("falls back to document.limited=false when the flag is absent", () => {
    mount({ actorOver: { limited: false } });
    expect(hasLimitedSheet()).toBe(false);
    expect(hasFullSheet()).toBe(true);
  });

  it("swaps to the limited view when ownership is downgraded mid-session", () => {
    mount({ canViewFullSheet: true });
    expect(hasFullSheet()).toBe(true);

    act(() =>
      publish({
        document: makeActor(),
        isEditable: false,
        canViewFullSheet: false,
      }),
    );

    expect(hasLimitedSheet()).toBe(true);
    expect(hasFullSheet()).toBe(false);
  });

  it("restores the full sheet when ownership is upgraded mid-session", () => {
    mount({ canViewFullSheet: false });
    expect(hasLimitedSheet()).toBe(true);

    act(() =>
      publish({
        document: makeActor(),
        isEditable: false,
        canViewFullSheet: true,
      }),
    );

    expect(hasFullSheet()).toBe(true);
    expect(hasLimitedSheet()).toBe(false);
  });
});
