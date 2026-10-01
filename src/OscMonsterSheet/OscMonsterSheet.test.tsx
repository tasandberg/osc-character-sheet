// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import OscMonsterSheetApp from "@src/OscMonsterSheet";
import { makeItem, makeMonster } from "./__fixtures__/dragonTurtle";
import type { MonsterActor } from "./types";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let settings: Record<string, unknown>;

(globalThis as { foundry?: unknown }).foundry = {
  utils: { debounce: (fn: unknown) => fn },
  applications: {
    ux: { TextEditor: { enrichHTML: (html: string) => Promise.resolve(html) } },
  },
};
(globalThis as { game?: unknown }).game = {
  system: { id: "ose" },
  settings: { get: (_scope: string, key: string) => settings[key] },
  i18n: { localize: (key: string) => key },
};
(globalThis as { CONFIG?: unknown }).CONFIG = {
  OSE: { colors: { green: "", red: "", yellow: "" }, roll_type: {} },
};
(globalThis as { fromUuidSync?: unknown }).fromUuidSync = () => null;

let container: HTMLDivElement;
let root: Root;

const connector = { onUpdate: () => () => {}, tearDown: () => {} } as never;

async function mount(
  actor: MonsterActor,
  { canEdit = true, canViewFullSheet = true } = {},
) {
  await act(async () =>
    root.render(
      <OscMonsterSheetApp
        actor={actor}
        contextConnector={connector}
        isEditable={canEdit}
        canViewFullSheet={canViewFullSheet}
      />,
    ),
  );
}

const text = () => container.textContent ?? "";

function button(name: string) {
  const match = [
    ...container.querySelectorAll<HTMLElement>("button, [role=button]"),
  ].find(
    (element) =>
      (element.getAttribute("aria-label") ?? element.textContent)?.trim() ===
      name,
  );
  if (!match) throw new Error(`No button named "${name}"`);
  return match;
}

function click(element: HTMLElement) {
  act(() => element.click());
}

function type(value: string, key: "Enter" | "Escape") {
  const input = container.querySelector("input")!;
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, value);
    input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });
}

beforeEach(() => {
  settings = { ascendingAC: false, morale: true };
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("OscMonsterSheet", () => {
  it("shows the stat block", async () => {
    await mount(makeMonster());
    for (const expected of [
      "Dragon Turtle",
      "Chaotic",
      "9,000",
      "Armour Class",
      "30**",
      "90′ (30′)*",
      "Claw",
      "Capsize",
    ])
      expect(text()).toContain(expected);
  });

  it("commits an edited value to the actor on Enter", async () => {
    const actor = makeMonster();
    actor.update = vi.fn().mockResolvedValue(actor);
    await mount(actor);

    click(button("Edit Armour Class"));
    type("3", "Enter");

    expect(actor.update).toHaveBeenCalledWith({ "system.ac.value": 3 });
    expect(container.querySelector("input")).toBeNull();
  });

  it("discards an edit on Escape", async () => {
    const actor = makeMonster();
    actor.update = vi.fn();
    await mount(actor);

    click(button("Edit Morale"));
    type("12", "Escape");

    expect(actor.update).not.toHaveBeenCalled();
  });

  it("rolls from the label", async () => {
    const actor = makeMonster();
    actor.rollMorale = vi.fn();
    actor.rollSave = vi.fn();
    await mount(actor);

    click(button("Morale"));
    click(button("Paralysis"));

    expect(actor.rollMorale).toHaveBeenCalled();
    expect(actor.rollSave).toHaveBeenCalledWith("paralysis", expect.anything());
  });

  it("spends a use, never below zero, when rolling an attack", async () => {
    const gaze = makeItem({
      name: "Gaze",
      system: { pattern: "red", counter: { value: 0, max: 1 } },
    });
    gaze.update = vi.fn().mockResolvedValue(gaze);
    gaze.roll = vi.fn();
    await mount(makeMonster({}, [gaze]));

    await act(async () => button("Gaze").click());

    expect(gaze.update).toHaveBeenCalledWith({ "system.counter.value": 0 });
    expect(gaze.roll).toHaveBeenCalled();
  });

  it("refills every weapon's uses on a new round", async () => {
    const actor = makeMonster();
    actor.updateEmbeddedDocuments = vi.fn();
    await mount(actor);

    click(button("New round"));

    expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith("Item", [
      { _id: "Claw", "system.counter.value": 2 },
      { _id: "Bite", "system.counter.value": 1 },
      { _id: "Breath", "system.counter.value": 1 },
    ]);
  });

  it("hides morale when the world morale rule is off", async () => {
    settings.morale = false;
    await mount(makeMonster());
    expect(text()).not.toContain("Morale");
  });

  it("is read-only for observers", async () => {
    await mount(makeMonster(), { canEdit: false });
    expect(container.querySelectorAll("[aria-label^='Edit ']")).toHaveLength(0);
    expect(text()).not.toContain("New round");
  });

  it("shows limited users only the portrait, name and notes", async () => {
    await mount(makeMonster(), { canEdit: false, canViewFullSheet: false });
    expect(text()).toContain("Dragon Turtle");
    expect(text()).toContain("Lurks beneath the waves.");
    for (const hidden of ["Armour Class", "Claw", "Hit Points", "Chaotic"])
      expect(text()).not.toContain(hidden);
  });
});
