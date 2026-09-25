// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import OscSheetProvider from "@app/OscSheetProvider";
import { EditModal } from "./EditModal";
import type { OSEActor } from "@domain/types";
import { FLAGS, flagDeletePath, flagPath } from "@domain/flags";

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
        cleric: {
          levels: [{ xp: 0, hd: "1d6", thac0: 19, saves: [1, 2, 3, 4, 5] }],
        },
        fighter: {
          levels: [{ xp: 0, hd: "1d8", thac0: 19, saves: [1, 2, 3, 4, 5] }],
        },
      },
    },
  },
};

const RAW_BASE = 120;
const DERIVED_BASE = 90;

type Retainer = { enabled: boolean; loyalty: number | null; wage: string };
type ActorOpts = {
  movementAuto?: boolean;
  rawBase?: number;
  scaledBase?: number;
  retainer?: Partial<Retainer>;
  flags?: Record<string, unknown>;
};

function makeActor({
  movementAuto = false,
  rawBase = RAW_BASE,
  scaledBase = DERIVED_BASE,
  retainer,
  flags,
}: ActorOpts = {}): OSEActor {
  const movement = { encounter: 30, overland: 18 };
  // Mirror OSE's getter: scaled by encumbrance when auto, raw #moveBase when manual.
  Object.defineProperty(movement, "base", {
    get: () => (movementAuto ? scaledBase : rawBase),
    set: () => {},
    enumerable: true,
    configurable: true,
  });

  const actor: Record<string, unknown> = {
    id: "self",
    name: "Test",
    flags,
    img: "portrait.png",
    system: {
      config: { movementAuto },
      details: {
        class: "fighter",
        title: "Veteran",
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
      thac0: { value: 17, bba: 2 },
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
      retainer: { enabled: false, loyalty: 0, wage: "", ...retainer },
    },
    _source: { system: { movement: { base: rawBase } } },
    items: { contents: [] },
  };
  actor.update = vi.fn(async (data: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(data)) deepSet(actor, k, v);
    // Foundry re-renders the sheet from a fresh snapshot; mirror that so controlled inputs follow.
    return {
      ...actor,
      system: { ...(actor.system as object) },
    } as unknown as OSEActor;
  });
  return actor as unknown as OSEActor;
}

const updateOf = (actor: OSEActor) =>
  actor.update as unknown as ReturnType<typeof vi.fn>;

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

const renderModal = (actor: OSEActor) =>
  act(() =>
    root.render(
      <OscSheetProvider
        initialActor={actor}
        source={actor}
        contextConnector={connector}
        canEdit
        canViewFullSheet
      >
        <EditModal open onClose={() => {}} />
      </OscSheetProvider>,
    ),
  );

const fieldByLabel = (label: string) =>
  Array.from(container.querySelectorAll<HTMLElement>(".ed-field")).find((f) =>
    f.querySelector(".lab")?.textContent?.startsWith(label),
  );

const inputByLabel = (label: string) =>
  fieldByLabel(label)!.querySelector("input") as HTMLInputElement;

const checkboxByLabel = (label: string) =>
  Array.from(
    container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
  ).find((i) => i.closest("label")?.textContent?.trim() === label)!;

const resetLink = (label: string) =>
  fieldByLabel(label)!.querySelector('button[title="Reset to rule default"]');

function setValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )!.set!;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

async function commit(input: HTMLInputElement, value: string) {
  await act(async () => {
    input.focus();
    setValue(input, value);
    input.blur();
    await Promise.resolve();
  });
}

async function click(el: HTMLElement) {
  await act(async () => {
    el.click();
    await Promise.resolve();
  });
}

async function pickOption(match: (text: string) => boolean) {
  const option = Array.from(
    document.querySelectorAll<HTMLElement>('[role="option"]'),
  ).find((r) => match(r.textContent ?? ""))!;
  await act(async () => {
    option.dispatchEvent(
      new MouseEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );
    await Promise.resolve();
  });
}

describe("EditModal class and alignment", () => {
  it("reflects the selected class after commit", async () => {
    const actor = makeActor();
    await renderModal(actor);

    expect(inputByLabel("Class").value).toBe("fighter");

    act(() => inputByLabel("Class").focus());
    await pickOption((t) => t.includes("cleric"));

    expect(updateOf(actor)).toHaveBeenCalledWith({
      "system.details.class": "cleric",
    });
    expect(actor.system.details.class).toBe("cleric");
    expect(inputByLabel("Class").value).toBe("cleric");
  });

  it("commits a preset B/X alignment on selection", async () => {
    const actor = makeActor();
    await renderModal(actor);

    expect(inputByLabel("Alignment").value).toBe("Neutral");

    act(() => inputByLabel("Alignment").focus());
    await pickOption((t) => t === "Chaotic");

    expect(updateOf(actor)).toHaveBeenCalledWith({
      "system.details.alignment": "Chaotic",
    });
    expect(actor.system.details.alignment).toBe("Chaotic");
  });
});

describe("EditModal THAC0 / Attack Bonus", () => {
  it("shows THAC0 (descending) with the class default as a reset link", async () => {
    await renderModal(makeActor());

    expect(inputByLabel("THAC0").value).toBe("17");
    expect(resetLink("THAC0")!.textContent).toContain("default · 19");
  });

  it("commits system.thac0.value on edit (descending)", async () => {
    const actor = makeActor();
    await renderModal(actor);

    await commit(inputByLabel("THAC0"), "15");

    expect(updateOf(actor)).toHaveBeenCalledWith({ "system.thac0.value": 15 });
  });

  it("shows Attack Bonus and commits system.thac0.bba (ascending)", async () => {
    (g.game as Record<string, unknown>).settings = { get: () => true };
    (g.game as Record<string, unknown>).system = { id: "ose" };
    try {
      const actor = makeActor();
      await renderModal(actor);

      expect(inputByLabel("Attack Bonus").value).toBe("2");
      // default = 19 - class thac0(19) = 0; stored bba 2 ≠ 0 → overridden
      expect(resetLink("Attack Bonus")!.textContent).toContain("default · 0");

      await commit(inputByLabel("Attack Bonus"), "4");

      expect(updateOf(actor)).toHaveBeenCalledWith({ "system.thac0.bba": 4 });
    } finally {
      delete (g.game as Record<string, unknown>).settings;
      delete (g.game as Record<string, unknown>).system;
    }
  });
});

describe("EditModal identity fields", () => {
  it("leaves the Hit Dice hint empty when the class has no default", async () => {
    const actor = makeActor();
    actor.system.details.class = "homebrew";
    await renderModal(actor);

    expect(fieldByLabel("Hit Dice")!.textContent).not.toContain("null");
    expect(resetLink("Hit Dice")).toBeNull();
  });

  it("puts no ceiling on Level, so a level past the class table is typable", async () => {
    const actor = makeActor();
    await renderModal(actor);

    expect(inputByLabel("Level").hasAttribute("max")).toBe(false);
    await commit(inputByLabel("Level"), "20");

    expect(updateOf(actor)).toHaveBeenCalledWith({
      "system.details.level": 20,
    });
  });
});

describe("EditModal base movement", () => {
  it("auto OFF shows the editable raw base (getter returns it unscaled)", async () => {
    await renderModal(makeActor());

    expect(inputByLabel("Base Movement").value).toBe(String(RAW_BASE));
    expect(inputByLabel("Base Movement").disabled).toBe(false);
    expect(checkboxByLabel("Auto-calculate movement").checked).toBe(false);
  });

  it("auto ON shows the encumbrance-scaled getter and disables the field", async () => {
    // base 120 at the first breakpoint → 120 × 0.75 = 90
    await renderModal(makeActor({ movementAuto: true }));

    expect(inputByLabel("Base Movement").value).toBe(String(DERIVED_BASE));
    expect(inputByLabel("Base Movement").disabled).toBe(true);
    expect(checkboxByLabel("Auto-calculate movement").checked).toBe(true);
  });

  it("auto ON scales the CUSTOM base (mirrors OSE — the override is used, not ignored)", async () => {
    // custom base 300 at the first breakpoint → 300 × 0.75 = 225
    await renderModal(
      makeActor({ movementAuto: true, rawBase: 300, scaledBase: 225 }),
    );

    expect(inputByLabel("Base Movement").value).toBe("225");
  });

  it("commits system.movement.base when edited (auto off)", async () => {
    const actor = makeActor();
    await renderModal(actor);

    await commit(inputByLabel("Base Movement"), "150");

    expect(updateOf(actor)).toHaveBeenCalledWith({
      "system.movement.base": 150,
    });
  });

  it("toggles system.config.movementAuto false when unchecked", async () => {
    const actor = makeActor({ movementAuto: true });
    await renderModal(actor);

    await click(checkboxByLabel("Auto-calculate movement"));

    expect(updateOf(actor)).toHaveBeenCalledWith({
      "system.config.movementAuto": false,
    });
  });

  it("toggles system.config.movementAuto true when checked", async () => {
    const actor = makeActor();
    await renderModal(actor);

    await click(checkboxByLabel("Auto-calculate movement"));

    expect(updateOf(actor)).toHaveBeenCalledWith({
      "system.config.movementAuto": true,
    });
  });
});

describe("EditModal retainer fields", () => {
  it("hides Wage and Loyalty Rating until the box is ticked", async () => {
    const actor = makeActor();
    await renderModal(actor);

    expect(checkboxByLabel("Retainer").checked).toBe(false);
    expect(fieldByLabel("Wage")).toBeUndefined();
    expect(fieldByLabel("Loyalty Rating")).toBeUndefined();

    await click(checkboxByLabel("Retainer"));

    expect(updateOf(actor)).toHaveBeenCalledWith({
      "system.retainer.enabled": true,
    });
    expect(fieldByLabel("Wage")).toBeDefined();
    expect(fieldByLabel("Loyalty Rating")).toBeDefined();
  });

  it("commits the wage string", async () => {
    const actor = makeActor({ retainer: { enabled: true, wage: "5gp" } });
    await renderModal(actor);

    expect(inputByLabel("Wage").value).toBe("5gp");
    await commit(inputByLabel("Wage"), "10gp/month");

    expect(updateOf(actor)).toHaveBeenCalledWith({
      "system.retainer.wage": "10gp/month",
    });
  });

  it("clamps the loyalty rating to 12", async () => {
    const actor = makeActor({ retainer: { enabled: true, loyalty: 8 } });
    await renderModal(actor);

    expect(inputByLabel("Loyalty Rating").value).toBe("8");
    await commit(inputByLabel("Loyalty Rating"), "20");

    expect(updateOf(actor)).toHaveBeenCalledWith({
      "system.retainer.loyalty": 12,
    });
  });
});

describe("EditModal employer", () => {
  const employer = (
    id: string,
    name: string,
    cha: number,
    loyalty: number,
  ) => ({
    id,
    name,
    type: "character",
    hasPlayerOwner: true,
    system: { scores: { cha: { value: cha, loyalty } } },
  });
  const employedBy = (id: string) => {
    const [, scope, key] = flagPath(FLAGS.employer).split(".");
    return { [scope]: { [key]: id } };
  };
  const openEmployer = () => act(() => inputByLabel("Employer").focus());
  const employerRows = () =>
    Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));

  beforeEach(() => {
    (g.game as Record<string, unknown>).actors = [
      { ...employer("a", "Aldric", 16, 9), img: "aldric.webp" },
      employer("b", "Brother Odo", 8, 6),
      { id: "self", name: "Test", type: "character", hasPlayerOwner: true },
      {
        id: "npc",
        name: "Innkeeper",
        type: "character",
        hasPlayerOwner: false,
      },
    ];
  });
  afterEach(() => {
    delete (g.game as Record<string, unknown>).actors;
  });

  it("lists None plus the other player-owned characters", async () => {
    await renderModal(makeActor({ retainer: { enabled: true } }));

    openEmployer();
    expect(employerRows().map((o) => o.textContent)).toEqual([
      "None",
      "Aldric",
      "BBrother Odo",
    ]);
  });

  it("renders each employer's portrait, or an initial without one", async () => {
    await renderModal(makeActor({ retainer: { enabled: true } }));

    openEmployer();
    const [, aldric, odo] = employerRows();
    expect(aldric.querySelector("img")!.getAttribute("src")).toBe(
      "aldric.webp",
    );
    expect(odo.querySelector("img")).toBeNull();
  });

  it("shows the committed employer as a portrait chip", async () => {
    await renderModal(
      makeActor({ retainer: { enabled: true }, flags: employedBy("a") }),
    );

    const chip = fieldByLabel("Employer")!.querySelector(".combobox-chip")!;
    expect(chip.querySelector("img")!.getAttribute("src")).toBe("aldric.webp");
    expect(chip.textContent).toBe("Aldric");
  });

  it("sets and clears the employer flag", async () => {
    const actor = makeActor({ retainer: { enabled: true } });
    await renderModal(actor);

    openEmployer();
    await pickOption((t) => t === "Aldric");
    expect(updateOf(actor)).toHaveBeenCalledWith({
      [flagPath(FLAGS.employer)]: "a",
    });
    openEmployer();
    await pickOption((t) => t === "None");
    expect(updateOf(actor)).toHaveBeenCalledWith({
      [flagDeletePath(FLAGS.employer)]: null,
    });
  });

  it("offers the employer's CHA loyalty as a confirmable reset", async () => {
    const actor = makeActor({
      retainer: { enabled: true, loyalty: 7 },
      flags: employedBy("a"),
    });
    await renderModal(actor);

    const reset = resetLink("Loyalty Rating") as HTMLButtonElement;
    expect(reset.textContent).toBe("Value based on employer’s CHA: 9");
    await click(reset);
    expect(updateOf(actor)).not.toHaveBeenCalled();
    const confirm = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent === "Reset",
    )!;
    await click(confirm);

    expect(updateOf(actor)).toHaveBeenCalledWith({
      "system.retainer.loyalty": 9,
    });
  });

  it("shows no hint without an employer", async () => {
    await renderModal(makeActor({ retainer: { enabled: true, loyalty: 7 } }));

    const loyalty = fieldByLabel("Loyalty Rating")!;
    expect(loyalty.querySelector(".hint, .ed-resetlink")).toBeNull();
  });
});

describe("EditModal header portrait", () => {
  it("renders a decorative, non-interactive image from actor.img", async () => {
    await renderModal(makeActor());

    const chip = container.querySelector("img")!;
    expect(chip.getAttribute("src")).toBe("portrait.png");
    expect(chip.getAttribute("alt")).toBe("");
    expect(chip.getAttribute("aria-hidden")).toBe("true");
    expect(chip.closest("button")).toBeNull();
    expect(chip.hasAttribute("tabindex")).toBe(false);
  });

  it("renders nothing rather than a broken image when actor.img is empty", async () => {
    const actor = makeActor();
    (actor as unknown as { img: string }).img = "";
    await renderModal(actor);

    expect(container.querySelector("img")).toBeNull();
  });

  it("drops the image when it fails to load", async () => {
    await renderModal(makeActor());

    const chip = container.querySelector("img")!;
    await act(async () => {
      chip.dispatchEvent(new Event("error", { bubbles: false }));
      await Promise.resolve();
    });

    expect(container.querySelector("img")).toBeNull();
  });
});
