// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { OscSheetContext } from "@app/context";
import SpellLevel from "@features/spells/SpellLevel";
import { selectSpellLevels } from "@features/spells/spells";
import type { OSEActor, OscSheetContextValue, OseSpell } from "@domain/types";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const magicMissile = {
  _id: "mm",
  name: "Magic Missile",
  img: "icons/magic/magic-missile.webp",
  system: {
    lvl: 1,
    memorized: 1,
    cast: 1,
    range: "150'",
    duration: "instant",
    save: "",
    roll: "1d6+1",
  },
  update: vi.fn(),
  sheet: { render: vi.fn() },
} as unknown as OseSpell;

const actor = {
  system: {
    details: { class: "Magic User", level: 3 },
    spells: {
      spellList: { 1: [magicMissile] },
      slots: { 1: { used: 1, max: 2 } },
      enabled: true,
    },
  },
  _source: { system: { spells: { 1: { max: 2 } } } },
} as unknown as OSEActor;

let host: HTMLDivElement;
let root: Root;

/** Map-backed game.settings so useSetting("showSpellImages") reads a real value. */
const mockSettings = (showSpellImages: boolean) => {
  (globalThis as { game?: unknown }).game = {
    i18n: { localize: (k: string) => k, format: (k: string) => k },
    settings: {
      get: (_ns: string, key: string) =>
        key === "showSpellImages" ? showSpellImages : undefined,
      set: () => Promise.resolve(),
    },
  };
};

const render = (freeCasting = false) => {
  const value = { actor, canEdit: true } as unknown as OscSheetContextValue;
  act(() => {
    root.render(
      <OscSheetContext.Provider value={value}>
        <SpellLevel vm={selectSpellLevels(actor, freeCasting)[0]} />
      </OscSheetContext.Provider>,
    );
  });
};

beforeEach(() => {
  (globalThis as { CONFIG?: unknown }).CONFIG = { OSE: { classes: {} } };
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  delete (globalThis as { CONFIG?: unknown }).CONFIG;
  delete (globalThis as { game?: unknown }).game;
});

const rowClasses = () => host.querySelector(".osc-spell")!.className;
const images = (sel: string) => host.querySelectorAll(`${sel} img`).length;
const openBook = () =>
  act(() => host.querySelector<HTMLButtonElement>(".osc-bookbtn")!.click());

describe("showSpellImages on", () => {
  beforeEach(() => mockSettings(true));

  it("renders the spell's image on a prepared row, in its own grid column", () => {
    render();
    expect(images(".osc-spell")).toBe(1);
    expect(rowClasses()).toContain("tw:grid-cols-[auto_1fr_auto]");
  });

  it("renders it on a free-casting row, after the favorite star", () => {
    render(true);
    expect(images(".osc-spell")).toBe(1);
    expect(rowClasses()).toContain("tw:grid-cols-[auto_auto_1fr_auto]");
  });

  it("renders it on spellbook entries", () => {
    render();
    openBook();
    expect(images('[data-testid="book-spell"]')).toBe(1);
  });
});

describe("showSpellImages off", () => {
  beforeEach(() => mockSettings(false));

  it("drops the image and its grid column from a prepared row", () => {
    render();
    expect(images(".osc-spell")).toBe(0);
    expect(rowClasses()).toContain("tw:grid-cols-[1fr_auto]");
    expect(host.querySelector(".osc-spell .spn")?.textContent).toBe(
      "Magic Missile",
    );
  });

  it("drops it from a free-casting row, keeping the star column", () => {
    render(true);
    expect(images(".osc-spell")).toBe(0);
    expect(rowClasses()).toContain("tw:grid-cols-[auto_1fr_auto]");
    expect(host.querySelector(".osc-spell .sp-fav")).not.toBeNull();
  });

  it("drops it from spellbook entries", () => {
    render();
    openBook();
    expect(host.querySelectorAll('[data-testid="book-spell"]').length).toBe(1);
    expect(images('[data-testid="book-spell"]')).toBe(0);
  });
});
