// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import OscSheetProvider from "@app/OscSheetProvider";
import { ExplorationSection } from "./ExplorationSection";
import { MODULE_ID } from "@domain/flags";
import type { OSEActor } from "@domain/types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const g = globalThis as Record<string, unknown>;
g.foundry = { utils: { debounce: (fn: unknown) => fn } };

const SKILLS_PATH = `flags.${MODULE_ID}.explorationSkills`;

function makeActor(skills: unknown[] = []): OSEActor {
  const actor: Record<string, unknown> = {
    name: "Test",
    img: "x.png",
    system: { exploration: { ld: 1, od: 2, sd: 1, ft: 1 } },
    flags: { [MODULE_ID]: { explorationSkills: skills } },
    items: { contents: [] },
  };
  actor.update = vi.fn(async () => actor as unknown as OSEActor);
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

function render(actor: OSEActor, canEdit = true) {
  act(() =>
    root.render(
      <OscSheetProvider
        initialActor={actor}
        source={actor}
        contextConnector={connector}
        canEdit={canEdit}
      >
        <ExplorationSection />
      </OscSheetProvider>,
    ),
  );
}

const fields = () => Array.from(container.querySelectorAll<HTMLElement>(".ed-field"));
const selectFor = (label: string) =>
  fields()
    .find((f) => f.querySelector(".lab")?.textContent === label)!
    .querySelector("select") as HTMLSelectElement;

function change(select: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLSelectElement.prototype,
    "value",
  )!.set!;
  setter.call(select, value);
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("ExplorationSection", () => {
  it("renders the schema skills, Forage/Hunt and any user-defined skill", () => {
    render(makeActor([{ key: "open-locks", label: "Open Locks", inSix: 2 }]));
    expect(fields().map((f) => f.querySelector(".lab")?.textContent)).toEqual([
      "Listen at Door",
      "Open Stuck Door",
      "Find Secret Door",
      "Find Trap",
      "Forage",
      "Hunt",
      "",
    ]);
  });

  it("commits a schema-backed skill to system data", async () => {
    const actor = makeActor();
    render(actor);
    await act(async () => {
      change(selectFor("Open Stuck Door"), "4");
      await Promise.resolve();
    });
    expect(actor.update as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      "system.exploration.od": 4,
    });
  });

  it("commits Forage to the module flag", async () => {
    const actor = makeActor();
    render(actor);
    await act(async () => {
      change(selectFor("Forage"), "5");
      await Promise.resolve();
    });
    expect(actor.update as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      [SKILLS_PATH]: [{ key: "fg", inSix: 5 }],
    });
  });

  it("adds a user-defined skill from the draft input", async () => {
    const actor = makeActor();
    render(actor);
    const input = container.querySelector(".ed-skill-add input") as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )!.set!;
    act(() => {
      setter.call(input, "Open Locks");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      (container.querySelector(".ed-skill-add button") as HTMLButtonElement).click();
      await Promise.resolve();
    });
    expect(actor.update as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      [SKILLS_PATH]: [{ key: "open-locks", label: "Open Locks", inSix: 1 }],
    });
  });

  it("removes a user-defined skill", async () => {
    const actor = makeActor([{ key: "open-locks", label: "Open Locks", inSix: 2 }]);
    render(actor);
    await act(async () => {
      (
        container.querySelector('[aria-label="Remove Open Locks"]') as HTMLButtonElement
      ).click();
      await Promise.resolve();
    });
    expect(actor.update as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      [SKILLS_PATH]: [],
    });
  });

  it("writes nothing on a read-only sheet", async () => {
    const actor = makeActor();
    render(actor, false);
    await act(async () => {
      change(selectFor("Forage"), "5");
      await Promise.resolve();
    });
    expect(actor.update as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });
});
