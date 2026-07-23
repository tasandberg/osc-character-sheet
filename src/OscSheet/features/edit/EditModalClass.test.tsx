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
        cleric: { levels: [{ xp: 0, hd: "1d6", saves: [1, 2, 3, 4, 5] }] },
        fighter: { levels: [{ xp: 0, hd: "1d8", saves: [1, 2, 3, 4, 5] }] },
      },
    },
  },
};

function makeActor(): OSEActor {
  const actor: Record<string, unknown> = {
    name: "Test",
    img: "x.png",
    system: {
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

const classInput = () =>
  Array.from(container.querySelectorAll<HTMLElement>(".ed-field"))
    .find((f) => f.querySelector(".lab")?.textContent?.startsWith("Class"))
    ?.querySelector("input") as HTMLInputElement;

describe("EditModal class combobox", () => {
  it("reflects the selected class after commit", async () => {
    const actor = makeActor();
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

    const input = classInput();
    expect(input.value).toBe("fighter");

    act(() => input.focus());
    const clericRow = Array.from(
      document.querySelectorAll<HTMLElement>('[role="option"]'),
    ).find(
      (r) => r.querySelector(".combobox-optlabel")?.textContent === "cleric",
    )!;
    await act(async () => {
      clericRow.dispatchEvent(
        new MouseEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await Promise.resolve();
    });

    expect(actor.update as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      "system.details.class": "cleric",
    });
    expect(actor.system.details.class).toBe("cleric");
    expect(classInput().value).toBe("cleric"); // display must follow the committed value
  });
});

const alignmentInput = () =>
  Array.from(container.querySelectorAll<HTMLElement>(".ed-field"))
    .find((f) => f.querySelector(".lab")?.textContent?.startsWith("Alignment"))
    ?.querySelector("input") as HTMLInputElement;

describe("EditModal alignment combobox", () => {
  it("commits a preset B/X alignment on selection", async () => {
    const actor = makeActor();
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

    const input = alignmentInput();
    expect(input.value).toBe("Neutral");

    act(() => input.focus());
    const chaotic = Array.from(
      document.querySelectorAll<HTMLElement>('[role="option"]'),
    ).find((r) => r.textContent === "Chaotic")!;
    await act(async () => {
      chaotic.dispatchEvent(
        new MouseEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await Promise.resolve();
    });

    expect(actor.update as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      "system.details.alignment": "Chaotic",
    });
    expect(actor.system.details.alignment).toBe("Chaotic");
  });
});
