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

function type(
  value: string,
  key: "Enter",
  selector = "[role=textbox]",
) {
  const field = container.querySelector<HTMLElement>(selector)!;
  act(() => {
    if (field instanceof HTMLInputElement) {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(field, value);
      field.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      field.textContent = value;
    }
    field.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
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
      "30d8",
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
    expect(container.querySelector("[role=textbox]")).toBeNull();
  });

  it("adds movement details from the movement popover", async () => {
    const actor = makeMonster({ details: { movement: "" } });
    actor.update = vi.fn().mockResolvedValue(actor);
    await mount(actor);

    click(button("Edit movement"));
    type("360′ (120′) flying", "Enter", "input[aria-label=Details]");

    expect(actor.update).toHaveBeenCalledWith({
      "system.details.movement": "360′ (120′) flying",
    });
  });

  it("rolls from the label", async () => {
    const actor = makeMonster();
    actor.rollMorale = vi.fn();
    actor.rollSave = vi.fn();
    actor.rollHP = vi.fn();
    await mount(actor);

    click(button("Morale"));
    click(button("Paralysis"));
    click(button("Roll hit points"));

    expect(actor.rollMorale).toHaveBeenCalled();
    expect(actor.rollSave).toHaveBeenCalledWith("paralysis", expect.anything());
    expect(actor.rollHP).toHaveBeenCalled();
  });

  it("attacks from the d20 button, spending a use, and opens the attack from its name", async () => {
    const gaze = makeItem({
      name: "Gaze",
      system: { pattern: "red", counter: { value: 1, max: 1 } },
    });
    gaze.update = vi.fn().mockResolvedValue(gaze);
    gaze.roll = vi.fn();
    gaze.sheet = { render: vi.fn() };
    await mount(makeMonster({}, [gaze]));

    await act(async () => button("Attack with Gaze").click());
    expect(gaze.update).toHaveBeenCalledWith({ "system.counter.value": 0 });
    expect(gaze.roll).toHaveBeenCalled();

    click(button("Gaze"));
    expect(gaze.sheet.render).toHaveBeenCalledWith(true);
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

  it("opens an ability from its name and rolls it from its roll tag", async () => {
    const sleeping = makeItem({
      name: "Sleeping",
      type: "ability",
      system: { roll: "1d100", rollTarget: 5, rollType: "below" },
    });
    sleeping.sheet = { render: vi.fn() };
    sleeping.roll = vi.fn();
    await mount(makeMonster({}, [sleeping]));

    click(button("Sleeping."));
    expect(sleeping.sheet.render).toHaveBeenCalledWith(true);
    expect(sleeping.roll).not.toHaveBeenCalled();

    click(button("roll 1d100 =5"));
    expect(sleeping.roll).toHaveBeenCalled();
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
