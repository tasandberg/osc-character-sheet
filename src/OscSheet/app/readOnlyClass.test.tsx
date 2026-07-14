// @vitest-environment jsdom
// Read-only presentation must track ownership changes, not freeze at mount.
// `initialProps` reach React only on the first render (foundry-vtt-react mounts
// once and republishes context thereafter), so a GM granting ownership mid-session
// must reach the app root through the context connector — including the
// `.is-readonly` class, which lives ABOVE the provider in ThemedRoot.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import OscSheetApp from "@src/OscSheet";
import { raistlin } from "@src/OscSheet/__fixtures__/raistlin";
import type { OSEActor, OscContext } from "@domain/types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Minimal Foundry globals the shell touches (debounce is passed through so
// republished context lands synchronously inside act()).
(globalThis as { foundry?: unknown }).foundry = {
  utils: { debounce: (fn: unknown) => fn },
};
(globalThis as { game?: unknown }).game = {
  i18n: { localize: (k: string) => k },
};
(globalThis as { CONFIG?: unknown }).CONFIG = { OSE: { classes: {} } };
// jsdom has no ResizeObserver; the layout components observe their containers.
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

function makeActor() {
  const { system, ...rest } = raistlin;
  return {
    ...rest,
    // The view-model fixture omits the bits only the full shell reads: an embedded
    // item collection (provider) and the spellcasting flag (tab list).
    system: { ...system, spells: { enabled: false } },
    items: { contents: [] },
    update: vi.fn().mockResolvedValue(undefined),
  } as unknown as OSEActor;
}

/** Mount the real app root the way osc-sheet.js does: props once, then context. */
function mount(actor: OSEActor, isEditable: boolean) {
  act(() =>
    root.render(
      <OscSheetApp
        actor={actor}
        source={actor}
        contextConnector={connector}
        isEditable={isEditable}
      />,
    ),
  );
}

const appRoot = () => container.querySelector(".osc-sheet-app")!;
const editButton = () =>
  [...container.querySelectorAll("button")].find(
    (b) => b.textContent?.trim() === "✎Edit",
  );

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

describe("read-only presentation — ownership granted while the sheet is open", () => {
  it("drops .is-readonly from the app root when the sheet republishes isEditable=true", () => {
    mount(makeActor(), false);
    expect(appRoot().classList.contains("is-readonly")).toBe(true);

    act(() => publish({ document: makeActor(), isEditable: true }));

    expect(appRoot().classList.contains("is-readonly")).toBe(false);
  });

  it("shows the Edit button when the sheet republishes isEditable=true", () => {
    mount(makeActor(), false);
    expect(editButton()).toBeUndefined();

    act(() => publish({ document: makeActor(), isEditable: true }));

    expect(editButton()).toBeDefined();
  });

  it("restores .is-readonly when ownership is revoked", () => {
    mount(makeActor(), true);
    expect(appRoot().classList.contains("is-readonly")).toBe(false);

    act(() => publish({ document: makeActor(), isEditable: false }));

    expect(appRoot().classList.contains("is-readonly")).toBe(true);
  });
});
