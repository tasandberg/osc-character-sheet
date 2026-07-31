// @vitest-environment jsdom
// Nothing writes `system.spells.<lvl>.max`, so a character who never opened OSE's
// own sheet had 0 capacity and every spellbook entry was disabled — GitHub #124.
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
    { xp: 1500, hd: "2d6", thac0: 19, saves: [11, 12, 14, 16, 15], spells: [1] },
    { xp: 3000, hd: "3d6", thac0: 19, saves: [11, 12, 14, 16, 15], spells: [2] },
  ],
};

const cure = {
  _id: "cure",
  name: "Cure Light Wounds",
  system: { lvl: 1, memorized: 0, cast: 0, range: "", duration: "", save: "", roll: "" },
  update: vi.fn(),
  sheet: { render: vi.fn() },
} as unknown as OseSpell;

/** Level-3 cleric, one known spell, no slot maxima ever stored. */
const actor = {
  system: {
    details: { class: "Cleric", level: 3 },
    spells: { spellList: { 1: [cure] }, slots: { 1: { used: 0, max: 0 } }, enabled: true },
  },
  _source: { system: { spells: {} } },
} as unknown as OSEActor;

let host: HTMLDivElement;
let root: Root;
const updateActor = vi.fn();

function render(canEdit = true) {
  const value = { actor, canEdit, updateActor } as unknown as OscSheetContextValue;
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
  delete (globalThis as unknown as { CONFIG?: unknown }).CONFIG;
});

const bookButton = () => {
  const open = host.querySelector<HTMLButtonElement>(".osc-bookbtn")!;
  act(() => open.click());
  return host.querySelector<HTMLButtonElement>(".osc-book .osc-bookspell")!;
};

describe("SpellLevel", () => {
  it("lets a caster memorise into the class's slots with nothing stored", () => {
    render();
    expect(host.querySelector(".osc-spellhead")?.textContent).toContain("0 /");
    const entry = bookButton();
    expect(entry.disabled).toBe(false);
    act(() => entry.click());
    expect(cure.update).toHaveBeenCalledWith({
      "system.memorized": 1,
      "system.cast": 1,
    });
  });

  it("writes the level's slot maximum when the field is edited", () => {
    render();
    const field = host.querySelector<HTMLInputElement>(".osc-slotmax")!;
    expect(field.value).toBe("2");
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    act(() => {
      field.focus();
      setValue.call(field, "4");
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.blur();
    });
    expect(updateActor).toHaveBeenCalledWith({ "system.spells.1.max": 4 });
  });

  it("shows the maximum as static text on a read-only sheet", () => {
    render(false);
    expect(host.querySelector(".osc-slotmax")).toBeNull();
    expect(host.querySelector(".osc-spellhead")?.textContent).toContain("2");
  });
});
