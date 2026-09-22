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
        fighter: {
          levels: [{ xp: 0, hd: "1d8", thac0: 19, saves: [1, 2, 3, 4, 5] }],
        },
      },
    },
  },
};

type Retainer = { enabled: boolean; loyalty: number | null; wage: string };

function makeActor(retainer?: Partial<Retainer>): OSEActor {
  const actor: Record<string, unknown> = {
    name: "Test",
    img: "portrait.png",
    system: {
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
      thac0: { value: 19, bba: 0 },
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
  Array.from(container.querySelectorAll<HTMLElement>(".ed-field")).find(
    (f) => f.querySelector(".lab")?.textContent === label,
  );

const retainerCheck = () =>
  container.querySelector(".ed-retainer input") as HTMLInputElement;

function setValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )!.set!;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("EditModal title", () => {
  it("keeps the Title field for a non-retainer", async () => {
    await renderModal(makeActor());

    const input = fieldByLabel("Title")!.querySelector("input")!;
    expect(input.value).toBe("Veteran");
    expect(fieldByLabel("Wage")).toBeUndefined();
  });

  it("keeps the Title field for a retainer, alongside Wage", async () => {
    await renderModal(makeActor({ enabled: true, wage: "5gp/month" }));

    const input = fieldByLabel("Title")!.querySelector("input")!;
    expect(input.value).toBe("Veteran");
    expect(fieldByLabel("Wage")).toBeDefined();
  });

  it("commits system.details.title for a retainer", async () => {
    const actor = makeActor({ enabled: true });
    await renderModal(actor);

    const input = fieldByLabel("Title")!.querySelector("input")!;
    await act(async () => {
      input.focus();
      setValue(input, "Linkboy");
      input.blur();
      await Promise.resolve();
    });

    expect(actor.update as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      "system.details.title": "Linkboy",
    });
  });
});

describe("EditModal retainer fields", () => {
  it("hides Wage and Loyalty Rating while the box is unchecked", async () => {
    await renderModal(makeActor());

    expect(retainerCheck().checked).toBe(false);
    expect(fieldByLabel("Wage")).toBeUndefined();
    expect(fieldByLabel("Loyalty Rating")).toBeUndefined();
  });

  it("reveals Wage and Loyalty Rating as ordinary fields once checked", async () => {
    await renderModal(makeActor({ enabled: true, loyalty: 8, wage: "5gp" }));

    expect(retainerCheck().checked).toBe(true);
    const wage = fieldByLabel("Wage")!;
    const loyalty = fieldByLabel("Loyalty Rating")!;
    expect(wage.querySelector("input")!.value).toBe("5gp");
    expect(loyalty.querySelector("input")!.value).toBe("8");
    expect(loyalty.querySelector("input")!.type).toBe("number");
  });

  it("reveals the fields when the box is ticked", async () => {
    const actor = makeActor();
    await renderModal(actor);

    await act(async () => {
      retainerCheck().click();
      await Promise.resolve();
    });

    expect(actor.update as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      "system.retainer.enabled": true,
    });
    expect(fieldByLabel("Wage")).toBeDefined();
    expect(fieldByLabel("Loyalty Rating")).toBeDefined();
  });

  it("commits the wage string", async () => {
    const actor = makeActor({ enabled: true });
    await renderModal(actor);

    const input = fieldByLabel("Wage")!.querySelector("input")!;
    await act(async () => {
      input.focus();
      setValue(input, "10gp/month");
      input.blur();
      await Promise.resolve();
    });

    expect(actor.update as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      "system.retainer.wage": "10gp/month",
    });
  });

  it("clamps the loyalty rating to 12", async () => {
    const actor = makeActor({ enabled: true, loyalty: 8 });
    await renderModal(actor);

    const input = fieldByLabel("Loyalty Rating")!.querySelector("input")!;
    await act(async () => {
      input.focus();
      setValue(input, "20");
      input.blur();
      await Promise.resolve();
    });

    expect(actor.update as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      "system.retainer.loyalty": 12,
    });
  });
});

describe("EditModal ability scores", () => {
  it("stays six cells wide for a retainer — no loyalty stamp", async () => {
    await renderModal(makeActor({ enabled: true, loyalty: 8 }));

    const grid = container.querySelector(".ed-abil")!;
    expect(grid.children.length).toBe(6);
    expect(grid.textContent).not.toContain("LR");
  });
});

describe("EditModal header portrait", () => {
  it("renders a decorative, non-interactive chip from actor.img", async () => {
    await renderModal(makeActor());

    const chip = container.querySelector<HTMLImageElement>(".ed-id-chip")!;
    expect(chip.tagName).toBe("IMG");
    expect(chip.getAttribute("src")).toBe("portrait.png");
    expect(chip.getAttribute("alt")).toBe("");
    expect(chip.getAttribute("aria-hidden")).toBe("true");
    expect(chip.closest("button")).toBeNull();
    expect(chip.hasAttribute("tabindex")).toBe(false);
    expect(container.querySelector(".ed-portrait")).toBeNull();
  });

  it("renders nothing rather than a broken image when actor.img is empty", async () => {
    const actor = makeActor();
    (actor as unknown as { img: string }).img = "";
    await renderModal(actor);

    expect(container.querySelector(".ed-id-chip")).toBeNull();
  });

  it("drops the chip when the image fails to load", async () => {
    await renderModal(makeActor());

    const chip = container.querySelector<HTMLImageElement>(".ed-id-chip")!;
    await act(async () => {
      chip.dispatchEvent(new Event("error", { bubbles: false }));
      await Promise.resolve();
    });

    expect(container.querySelector(".ed-id-chip")).toBeNull();
  });
});
