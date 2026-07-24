// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import OscSheetProvider from "@app/OscSheetProvider";
import { EditModal } from "./EditModal";
import type { OSEActor } from "@domain/types";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function deepSet(obj: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] ??= {};
    cur = cur[parts[i]] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

const g = globalThis as Record<string, unknown>;
g.foundry = { utils: { debounce: (fn: unknown) => fn } };
g.game = { user: { isGM: true } };
g.Roll = { validate: () => true };
g.ChatMessage = { getSpeaker: () => ({}) };
g.CONFIG = {
  OSE: {
    classes: {
      classic: {
        fighter: { levels: [{ xp: 0, hd: "1d8", saves: [1, 2, 3, 4, 5] }] },
      },
    },
  },
};

const RAW_BASE = 120; // stored (manual) base
const DERIVED_BASE = 90; // encumbrance-scaled getter value ≠ raw

function makeActor(
  movementAuto: boolean,
  rawBase = RAW_BASE,
  scaled = DERIVED_BASE,
): OSEActor {
  const movement = { encounter: 30, overland: 18 };
  // Mirror OSE's getter: scaled by encumbrance when auto, raw #moveBase when manual.
  Object.defineProperty(movement, "base", {
    get: () => (movementAuto ? scaled : rawBase),
    set: () => {},
    enumerable: true,
    configurable: true,
  });

  const actor: Record<string, unknown> = {
    name: "Test",
    img: "x.png",
    system: {
      config: { movementAuto },
      details: {
        class: "fighter",
        title: "",
        alignment: "Neutral",
        level: 1,
        xp: { value: 0, next: 2000 },
      },
      scores: {
        str: { value: 10, mod: 0 },
        int: { value: 10, mod: 0 },
        wis: { value: 10, mod: 0 },
        dex: { value: 10, mod: 0, init: 0 },
        con: { value: 10, mod: 0 },
        cha: { value: 10, mod: 0 },
      },
      hp: { value: 5, max: 5, hd: "1d8" },
      thac0: { value: 19, bba: 0 },
      movement,
      saves: {
        death: { value: 12 },
        wand: { value: 13 },
        paralysis: { value: 14 },
        breath: { value: 15 },
        spell: { value: 16 },
      },
      exploration: { ld: 1, od: 2, sd: 1, ft: 1 },
      initiative: { mod: 0 },
    },
    _source: { system: { movement: { base: rawBase } } },
    items: { contents: [] },
  };
  actor.update = vi.fn(async (data: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(data)) deepSet(actor, k, v);
    return {
      ...actor,
      system: { ...(actor.system as object) },
    } as unknown as OSEActor;
  });
  return actor as unknown as OSEActor;
}

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

function render(actor: OSEActor) {
  act(() =>
    root.render(
      <OscSheetProvider
        initialActor={actor}
        source={actor}
        contextConnector={connector}
        canEdit
      >
        <EditModal open onClose={() => {}} />
      </OscSheetProvider>,
    ),
  );
}

const moveField = () =>
  Array.from(container.querySelectorAll<HTMLElement>(".ed-field")).find(
    (f) => f.querySelector(".lab")?.textContent === "Base Movement",
  )!;
const moveInput = () => moveField().querySelector("input[type=number]") as HTMLInputElement;
const autoCheck = () =>
  moveField().querySelector(".ed-movecalc input") as HTMLInputElement;

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("EditModal base movement", () => {
  it("auto OFF shows the editable raw base (getter returns it unscaled)", () => {
    render(makeActor(false));
    expect(moveInput().value).toBe(String(RAW_BASE));
    expect(moveInput().disabled).toBe(false);
    expect(autoCheck().checked).toBe(false);
  });

  it("auto ON shows the encumbrance-scaled getter and disables the field", () => {
    // base 120 at the first breakpoint → 120 × 0.75 = 90
    render(makeActor(true));
    expect(moveInput().value).toBe(String(DERIVED_BASE));
    expect(moveInput().disabled).toBe(true);
    expect(autoCheck().checked).toBe(true);
  });

  it("auto ON scales the CUSTOM base (mirrors OSE — the override is used, not ignored)", () => {
    // custom base 300 at the first breakpoint → 300 × 0.75 = 225
    render(makeActor(true, 300, 225));
    expect(moveInput().value).toBe("225");
  });

  it("commits system.movement.base when edited (auto off)", async () => {
    const actor = makeActor(false);
    render(actor);
    act(() => moveInput().focus());
    act(() => setInputValue(moveInput(), "150"));
    await act(async () => {
      moveInput().blur();
      await Promise.resolve();
    });
    expect(actor.update as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      "system.movement.base": 150,
    });
  });

  it("toggles system.config.movementAuto false when unchecked", async () => {
    const actor = makeActor(true);
    render(actor);
    await act(async () => {
      autoCheck().click();
      await Promise.resolve();
    });
    expect(actor.update as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      "system.config.movementAuto": false,
    });
  });

  it("toggles system.config.movementAuto true when checked", async () => {
    const actor = makeActor(false);
    render(actor);
    await act(async () => {
      autoCheck().click();
      await Promise.resolve();
    });
    expect(actor.update as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      "system.config.movementAuto": true,
    });
  });
});
