// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import OscMonsterSheetApp from "@src/OscMonsterSheet";
import { makeItem, makeMonster } from "./__fixtures__/dragonTurtle";
import type { MonsterActor } from "./types";
import { notifySettingChanged, type SettingKey } from "@src/OscSheet/settings";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let settings: Record<string, unknown>;

(globalThis as { foundry?: unknown }).foundry = {
  utils: { debounce: (fn: unknown) => fn, escapeHTML: (html: string) => html },
  applications: {
    ux: { TextEditor: { enrichHTML: (html: string) => Promise.resolve(html) } },
  },
};
(globalThis as { game?: unknown }).game = {
  system: { id: "ose" },
  settings: {
    get: (_scope: string, key: string) => settings[key],
    set: (_scope: string, key: SettingKey, value: unknown) => {
      settings[key] = value;
      notifySettingChanged(key);
      return Promise.resolve(value);
    },
  },
  i18n: { localize: (key: string) => key },
};
(globalThis as { CONFIG?: unknown }).CONFIG = {
  OSE: {
    colors: { green: "Green", red: "Red", yellow: "Yellow" },
    roll_type: {},
  },
};
(globalThis as { fromUuidSync?: unknown }).fromUuidSync = () => null;
(globalThis as { Roll?: unknown }).Roll = class {
  total = 10;
  terms = [];
  constructor(public formula: string) {}
  evaluate() {
    return Promise.resolve(this);
  }
  getTooltip() {
    return Promise.resolve("");
  }
};
const chatMessage = { create: vi.fn(), getSpeaker: () => ({}) };
(globalThis as { ChatMessage?: unknown }).ChatMessage = chatMessage;
const postedFormula = () =>
  (chatMessage.create.mock.lastCall?.[0] as { rolls: { formula: string }[] })
    .rolls[0].formula;

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

function type(value: string, key: "Enter", selector = "[role=textbox]") {
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
      "90′ (30′) · 30' (10') on land",
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

  it("offers an unset retainer loyalty for editing", async () => {
    await mount(
      makeMonster({ system: { retainer: { enabled: true, loyalty: null } } }),
    );

    expect(button("Edit Loyalty").textContent).toBe("—");
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

  it("rolls lair numbers appearing from their own row", async () => {
    const actor = makeMonster();
    actor.rollAppearing = vi.fn();
    await mount(actor);

    click(button("Roll Lair"));

    expect(actor.rollAppearing).toHaveBeenCalledWith(
      expect.objectContaining({ check: "wilderness" }),
    );
    expect(button("Edit Number appearing in a lair").textContent).toBe("1d4");
  });

  it("rolls from the die after the value", async () => {
    const actor = makeMonster();
    actor.rollMorale = vi.fn();
    actor.rollSave = vi.fn();
    await mount(actor);

    click(button("Roll Morale"));
    click(button("Paralysis"));

    expect(actor.rollMorale).toHaveBeenCalled();
    expect(actor.rollSave).toHaveBeenCalledWith("paralysis", expect.anything());
  });

  it("sets current and max hit points to the rolled total", async () => {
    const actor = makeMonster();
    actor.rollHitDice = async () => ({ total: 97 });
    actor.update = vi.fn().mockResolvedValue(actor);
    await mount(actor);

    await act(async () => button("Roll hit points").click());

    expect(actor.update).toHaveBeenCalledWith({
      "system.hp.max": 97,
      "system.hp.value": 97,
    });
  });

  it("rolls to hit from ATK, spending a use, and opens the attack from its name", async () => {
    settings.ascendingAC = true;
    const gaze = makeItem({
      name: "Gaze",
      system: { pattern: "red", bonus: 1, counter: { value: 1, max: 1 } },
    });
    gaze.update = vi.fn().mockResolvedValue(gaze);
    gaze.sheet = { render: vi.fn() };
    await mount(makeMonster({}, [gaze]));

    await act(async () => button("Attack with Gaze").click());
    expect(gaze.update).toHaveBeenCalledWith({ "system.counter.value": 0 });
    expect(postedFormula()).toBe("1d20+14+1");

    click(button("Gaze"));
    expect(gaze.sheet.render).toHaveBeenCalledWith(true);
  });

  it("rolls damage with the weapon bonus from DMG", async () => {
    const spear = makeItem({
      name: "Spear",
      system: { damage: "1d6", bonus: 2 },
    });
    await mount(makeMonster({}, [spear]));

    await act(async () => button("Roll damage for Spear").click());

    expect(postedFormula()).toBe("1d6+2");
  });

  it("sets how many times an attack can be used per round", async () => {
    const tail = makeItem({ name: "Tail" });
    tail.update = vi.fn().mockResolvedValue(tail);
    await mount(makeMonster({}, [tail]));

    click(button("Edit Tail attacks per round"));
    type("2", "Enter");

    expect(tail.update).toHaveBeenCalledWith({
      "system.counter.max": 2,
      "system.counter.value": 2,
    });
  });

  it("opens the attack's actions from its overflow button", async () => {
    await mount(makeMonster());

    click(button("More actions for Claw"));

    const menu = container.querySelector("[role=menu][aria-label=Claw]");
    const actions = [...(menu?.querySelectorAll("[role=menuitem]") ?? [])].map(
      (item) => item.textContent,
    );
    expect(actions).toEqual([
      "View",
      "Attack group›",
      "Show in chat",
      "Delete",
    ]);
  });

  it("moves an attack to another group from its pip", async () => {
    const bite = makeItem({ name: "Bite", system: { pattern: "red" } });
    bite.update = vi.fn();
    await mount(makeMonster({}, [bite]));

    click(button("Attack pattern: red"));
    const menu = container.querySelector(
      "[role=menu][aria-label='Attack group']",
    );
    const green = [
      ...(menu?.querySelectorAll("[role=menuitemradio]") ?? []),
    ].find((item) => item.textContent?.startsWith("Green"));
    act(() => {
      green?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });

    expect(bite.update).toHaveBeenCalledWith({ "system.pattern": "green" });
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

  it("offers an Inventory tab listing the monster's gear once inventory is enabled", async () => {
    const tabs = () =>
      [...container.querySelectorAll<HTMLElement>("[role=tab]")].map(
        (tab) => tab.textContent,
      );
    const pearl = makeItem({ name: "Black Pearl", type: "item" });
    await mount(makeMonster({}, [pearl]));
    expect(tabs()).toEqual(["Stats", "Notes"]);

    act(() => root.unmount());
    root = createRoot(container);
    await mount(
      makeMonster({ system: { config: { enableInventory: true } } }, [pearl]),
    );
    expect(tabs()).toEqual(["Stats", "Inventory", "Notes"]);
    click(button("Inventory"));

    expect(text()).toContain("Black Pearl");
  });

  it("offers a Spells tab listing the monster's spells once it casts", async () => {
    const charm = makeItem({
      name: "Charm Person",
      type: "spell",
      system: { lvl: 1, cast: 1, memorized: 1 },
    });
    await mount(
      makeMonster(
        {
          system: {
            spells: {
              enabled: true,
              slots: { 1: { used: 0, max: 1 } },
              spellList: { 1: [charm] },
            },
          },
        },
        [charm],
      ),
    );
    click(button("Spells"));

    expect(text()).toContain("Charm Person");
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

    click(button("Sleeping"));
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

  it("keeps the character sheet's theme until the monster preferences override it", async () => {
    settings.theme = "cream";
    await mount(makeMonster(), { canEdit: false });
    click(button("Settings"));
    const same = [...container.querySelectorAll("label")]
      .find((label) => label.textContent === "Same as character sheet")!
      .querySelector("input")!;
    const themeOption = (name: string) =>
      [
        ...container.querySelectorAll<HTMLLabelElement>(
          "[role=radiogroup][aria-label=Theme] label",
        ),
      ]
        .find((option) => option.textContent === name)!
        .querySelector("input")!;
    expect(same.checked).toBe(true);
    expect(themeOption("Light").checked).toBe(true);
    expect(themeOption("Dark").disabled).toBe(true);

    click(same);
    expect(settings.monsterTheme).toBe("cream");
    click(themeOption("Dark"));
    expect(settings.monsterTheme).toBe("dark");
  });
});
