// @vitest-environment jsdom
// GitHub #124: nothing writes `system.spells.<lvl>.max`, so a character who never
// opened OSE's own sheet had 0 capacity and could memorise nothing.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { OscSheetContext } from "@app/context";
import SpellLevel from "@features/spells/SpellLevel";
import { selectSpellLevels } from "@features/spells/spells";
import type { OSEActor, OscSheetContextValue, OseSpell } from "@domain/types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const CLERIC = {
  name: "Cleric",
  requirements: {},
  levels: [
    { xp: 0, hd: "1d6", thac0: 19, saves: [11, 12, 14, 16, 15], spells: [0] },
    {
      xp: 1500,
      hd: "2d6",
      thac0: 19,
      saves: [11, 12, 14, 16, 15],
      spells: [1],
    },
    {
      xp: 3000,
      hd: "3d6",
      thac0: 19,
      saves: [11, 12, 14, 16, 15],
      spells: [2],
    },
  ],
};

const cure = {
  _id: "cure",
  name: "Cure Light Wounds",
  system: {
    lvl: 1,
    memorized: 0,
    cast: 0,
    range: "",
    duration: "",
    save: "",
    roll: "",
  },
  update: vi.fn(),
  sheet: { render: vi.fn() },
} as unknown as OseSpell;

/** A caster with one known spell and no slot maximum ever stored. */
const actorOf = (cls: string) =>
  ({
    system: {
      details: { class: cls, level: 3 },
      spells: {
        spellList: { 1: [cure] },
        slots: { 1: { used: 0, max: 0 } },
        enabled: true,
      },
    },
    _source: { system: { spells: {} } },
  }) as unknown as OSEActor;

const cleric = actorOf("Cleric");
/** No entry in CONFIG.OSE.classes → no rulebook slot table to default from. */
const homebrew = actorOf("Warlock");
/** Slot max stored as 5 where the class table says 2 — opens already differing. */
const overridden = {
  system: {
    details: { class: "Cleric", level: 3 },
    spells: { spellList: { 1: [cure] }, slots: { 1: { used: 0, max: 5 } }, enabled: true },
  },
  _source: { system: { spells: { 1: { max: 5 } } } },
} as unknown as OSEActor;
/** Stored lowercase — the default line should still name the class canonically. */
const lowercase = actorOf("cleric");
/** A recognized class, but a level past the end of its progression table. */
const offTable = {
  ...cleric,
  system: { ...cleric.system, details: { class: "Cleric", level: 9 } },
} as OSEActor;

let host: HTMLDivElement;
let root: Root;
const updateActor = vi.fn();

function render(actor: OSEActor = cleric, canEdit = true) {
  const value = {
    actor,
    canEdit,
    updateActor,
  } as unknown as OscSheetContextValue;
  act(() => {
    root.render(
      <OscSheetContext.Provider value={value}>
        <SpellLevel vm={selectSpellLevels(actor, false)[0]} />
      </OscSheetContext.Provider>,
    );
  });
}

beforeEach(() => {
  (globalThis as unknown as { CONFIG: unknown }).CONFIG = {
    OSE: { classes: { classic: { Cleric: CLERIC } } },
  };
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  updateActor.mockReset();
  vi.mocked(cure.update).mockReset();
  delete (globalThis as unknown as { CONFIG?: unknown }).CONFIG;
});

const q = <T extends Element>(sel: string) => host.querySelector<T>(sel);
const text = (sel: string) => q(sel)?.textContent ?? "";
const openBook = () => {
  act(() => q<HTMLButtonElement>(".osc-bookbtn")!.click());
  return q<HTMLButtonElement>(".osc-book .osc-bookspell")!;
};
const openDialog = () => {
  act(() => q<HTMLButtonElement>(".osc-slotedit")!.click());
  return q<HTMLInputElement>(".modal .osc-slotmax")!;
};
const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
/** Type and blur — the order a click on Save produces. */
const type = (field: HTMLInputElement, value: string) =>
  act(() => {
    field.focus();
    setValue.call(field, value);
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.blur();
  });
/** jsdom applies no CSS, so the hidden state is asserted through its class and
 *  the `inert` that backs it up. */
const hidden = () => {
  const group = q(".osc-slotdefaults");
  if (!group) return null;
  const out = group.classList.contains("is-out");
  expect(group.hasAttribute("inert")).toBe(out);
  return out;
};
/** "in" | "out" | null — which fade class is on the group right now. */
const anim = () => {
  const cl = q(".osc-slotdefaults")!.classList;
  return cl.contains("fade-in") ? "in" : cl.contains("fade-out") ? "out" : null;
};
const byLabel = (label: string) =>
  Array.from(host.querySelectorAll<HTMLButtonElement>(".modal button")).find(
    (b) => b.textContent?.trim() === label,
  )!;

describe("SpellLevel head", () => {
  it("lets a caster memorise into the class's slots with nothing stored", () => {
    render();
    const entry = openBook();
    expect(entry.disabled).toBe(false);
    act(() => entry.click());
    expect(cure.update).toHaveBeenCalledWith({
      "system.memorized": 1,
      "system.cast": 1,
    });
  });

  it("reads the maximum as plain text, with the pencil in the label's place", () => {
    render();
    expect(text(".osc-spellhead")).toContain("0 / 2");
    expect(q(".osc-spellhead input")).toBeNull();
    expect(q(".osc-slotedit")?.getAttribute("aria-label")).toBe("Edit Level 1 slots");
  });

  it("has no pencil on a read-only sheet", () => {
    render(cleric, false);
    expect(q(".osc-slotedit")).toBeNull();
    expect(text(".osc-spellhead")).toContain("0 / 2");
  });
});

describe("slot maximum dialog", () => {
  it("opens from the pencil at the level's current maximum, under a label", () => {
    render();
    expect(openDialog().value).toBe("2");
    // The structure `.modal-scrim:has(.modal-inset)` needs.
    expect(q(".modal-scrim > .modal.modal-inset.osc-slot-modal")).not.toBeNull();
    expect(text(".modal-body .field-label")).toBe("Level 1 spell slots:");
    expect(text(".osc-slotdefault")).toBe("default 2");
    // At the default: hidden, but still mounted so the dialog doesn't resize.
    expect(hidden()).toBe(true);
    expect(q(".osc-slotdefaults")).not.toBeNull();
  });

  it("reveals the reset group only while the value differs from the default", () => {
    render();
    const field = openDialog();
    expect(hidden()).toBe(true);
    type(field, "5");
    expect(hidden()).toBe(false);
    expect(anim()).toBe("in");
    const group = q<HTMLElement>(".osc-slotdefaults")!;
    expect(Array.from(group.children).map((c) => c.className.split(" ")[0])).toEqual([
      "ed-resetlink",
      "icon-btn",
    ]);
    expect(q(".osc-slotinfo .fa-circle-info")).not.toBeNull();
    type(field, "2");
    expect(hidden()).toBe(true);
    expect(anim()).toBe("out");
  });

  // The bug: a fade class derived from the current value plays on mount.
  it("animates nothing on open, at the default or away from it", () => {
    render();
    openDialog();
    expect(hidden()).toBe(true);
    expect(anim()).toBeNull();
    act(() => byLabel("Cancel").click());

    render(overridden);
    expect(openDialog().value).toBe("5");
    expect(hidden()).toBe(false);
    expect(anim()).toBeNull();
  });

  it("forgets the last fade when the dialog is reopened", () => {
    render();
    const field = openDialog();
    type(field, "5");
    expect(anim()).toBe("in");
    act(() => byLabel("Cancel").click());
    openDialog();
    expect(hidden()).toBe(true);
    expect(anim()).toBeNull();
  });

  it("saves the typed value to the level's maximum", () => {
    render();
    type(openDialog(), "4");
    act(() => byLabel("Save").click());
    expect(updateActor).toHaveBeenCalledWith({ "system.spells.1.max": 4 });
    expect(q(".modal")).toBeNull();
  });

  it("discards the edit on cancel", () => {
    render();
    type(openDialog(), "4");
    act(() => byLabel("Cancel").click());
    expect(updateActor).not.toHaveBeenCalled();
  });

  it("spells the detail out in the info tooltip, class named canonically", () => {
    render(lowercase);
    openDialog();
    expect(text(".osc-slot-tip")).toBe("Level 3 Cleric — 2 Level 1 spell slots by default.");
  });

  it("reaches the tooltip without a mouse: focusing the icon opens it", () => {
    render();
    openDialog();
    const info = q<HTMLButtonElement>(".osc-slotinfo")!;
    const pop = q<HTMLElement>(".osc-slot-tip")!;
    expect(info.getAttribute("aria-label")).toBe(pop.textContent);
    expect(info.tabIndex).toBe(0);
    expect(pop.hasAttribute("data-open")).toBe(false);
    act(() => info.focus());
    expect(pop.hasAttribute("data-open")).toBe(true);
    act(() => info.blur());
    expect(pop.hasAttribute("data-open")).toBe(false);
  });

  it("puts the class default back when the default line is clicked", () => {
    render();
    const field = openDialog();
    type(field, "7");
    expect(field.value).toBe("7");
    expect(hidden()).toBe(false);
    const line = q<HTMLButtonElement>(".osc-slotdefault")!;
    expect(line.tagName).toBe("BUTTON");
    act(() => line.click());
    expect(field.value).toBe("2");
    expect(hidden()).toBe(true);
    expect(anim()).toBe("out");
  });

  it("clamps a negative maximum to zero", () => {
    render();
    const field = openDialog();
    type(field, "-3");
    act(() => byLabel("Save").click());
    expect(updateActor).toHaveBeenCalledWith({ "system.spells.1.max": 0 });
  });

  it("keeps the hidden group out of the tab order", () => {
    render();
    openDialog();
    const group = q<HTMLElement>(".osc-slotdefaults")!;
    expect(group.classList.contains("is-out")).toBe(true);
    expect(group.hasAttribute("inert")).toBe(true);
    expect(q<HTMLElement>(".osc-slotinfo")!.closest("[inert]")).toBe(group);
  });

  it("offers no default line for an unrecognized class", () => {
    render(homebrew);
    expect(openDialog().value).toBe("0");
    expect(q(".osc-slotdefaults")).toBeNull();
    expect(q(".osc-slotinfo")).toBeNull();
    expect(text(".modal-body")).toContain("No rulebook default");
  });

  it("offers no default line for a level past the class table", () => {
    render(offTable);
    expect(openDialog().value).toBe("0");
    expect(q(".osc-slotdefaults")).toBeNull();
  });
});
