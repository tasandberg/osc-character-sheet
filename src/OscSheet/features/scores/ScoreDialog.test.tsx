// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import OscSheetProvider from "@app/OscSheetProvider";
import { ScoreDialog } from "./ScoreDialog";
import type { OSEActor } from "@domain/types";
import moduleStrings from "@src/../lang/en.json";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const OSE_STRINGS: Record<string, string> = {
  "OSE.scores.con.long": "Constitution",
  "OSE.scores.con.short": "CON",
};
const moduleString = (k: string) =>
  k
    .split(".")
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown>)?.[part],
      moduleStrings,
    );
const lookup = (k: string) => {
  const value = OSE_STRINGS[k] ?? moduleString(k);
  return typeof value === "string" ? value : k;
};

const g = globalThis as Record<string, unknown>;
g.foundry = { utils: { debounce: (fn: unknown) => fn } };
g.game = {
  i18n: {
    has: (k: string) => lookup(k) !== k,
    localize: lookup,
    format: (k: string, data: Record<string, string>) =>
      lookup(k).replace(/\{(\w+)\}/g, (_, n) => data[n]),
  },
};

type FakeEffect = {
  name: string;
  changes?: { key: string; mode: number; value: string }[];
  system?: { changes: { key: string; type: string; value: number }[] };
};

const updates: Record<string, unknown>[] = [];

function makeActor({
  base,
  total,
  mod,
  effects,
}: {
  base: number;
  total: number;
  mod: number;
  effects: FakeEffect[];
}) {
  const actor: Record<string, unknown> = {
    name: "Brakka",
    items: { contents: [] },
    system: { scores: { con: { value: total, mod } } },
    _source: { system: { scores: { con: { value: base } } } },
    get appliedEffects() {
      return effects.map((e, i) => ({
        uuid: `Effect.${i}`,
        ...e,
      }));
    },
    update: async (data: Record<string, unknown>) => {
      updates.push(data);
      return actor;
    },
  };
  return actor as unknown as OSEActor;
}

let container: HTMLDivElement;
let root: Root;
const connector = {
  onUpdate: () => {},
  tearDown: () => {},
} as never;

beforeEach(() => {
  updates.length = 0;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const renderDialog = (actor: OSEActor, canEdit = true) =>
  act(() =>
    root.render(
      <OscSheetProvider
        initialActor={actor}
        source={actor}
        contextConnector={connector}
        canEdit={canEdit}
        canViewFullSheet
      >
        <ScoreDialog scoreKey="con" onClose={() => {}} />
      </OscSheetProvider>,
    ),
  );

const adjustments = () =>
  [
    ...container.querySelectorAll<HTMLElement>(
      'ul[aria-label="Adjustments"] li',
    ),
  ].map((row) => [...row.children].map((cell) => cell.textContent));
const baseInput = () => container.querySelector<HTMLInputElement>("input")!;

describe("ScoreDialog", () => {
  it("lists each effect change on the score, then OSE's total", () => {
    renderDialog(
      makeActor({
        base: 12,
        total: 13,
        mod: 1,
        effects: [
          {
            name: "Dwarf",
            changes: [
              { key: "system.scores.con.value", mode: 2, value: "1" },
              { key: "system.scores.cha.value", mode: 2, value: "-1" },
            ],
          },
          {
            name: "Ring of Vigour",
            system: {
              changes: [
                { key: "system.scores.con.value", type: "add", value: 0 },
              ],
            },
          },
        ],
      }),
    );
    expect(baseInput().value).toBe("12");
    expect(adjustments()).toEqual([
      ["Dwarf", "+1"],
      ["Ring of Vigour", "+0"],
    ]);
    expect(container.textContent).toContain("Total CON13");
  });

  it("labels a non-additive change by its mode and keeps OSE's score", () => {
    renderDialog(
      makeActor({
        base: 9,
        total: 18,
        mod: 3,
        effects: [
          {
            name: "Gauntlets of Ogre Power",
            changes: [{ key: "system.scores.con.value", mode: 5, value: "18" }],
          },
        ],
      }),
    );
    expect(adjustments()).toEqual([["Gauntlets of Ogre Power", "Set to 18"]]);
    expect(container.textContent).toContain("Total CON18");
  });

  it("explains when OSE limits a race adjustment", () => {
    renderDialog(
      makeActor({
        base: 18,
        total: 18,
        mod: 3,
        effects: [
          {
            name: "Dwarf",
            changes: [{ key: "system.scores.con.value", mode: 2, value: "1" }],
          },
        ],
      }),
    );
    expect(container.textContent).toContain(
      "Race adjustments can't take a score past 3 or 18.",
    );
  });

  it("hides the adjustments when nothing adjusts the score", () => {
    renderDialog(makeActor({ base: 10, total: 10, mod: 0, effects: [] }));
    expect(container.textContent).not.toContain("Adjustments");
    expect(container.textContent).not.toContain("Race adjustments");
  });

  it("saves an edited base score to the actor, kept within 1 to 20", async () => {
    renderDialog(makeActor({ base: 12, total: 13, mod: 1, effects: [] }));
    const input = baseInput();
    expect(input.labels?.[0]?.textContent).toBe("Base score");
    act(() => input.focus());
    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(input, "25");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => input.blur());
    expect(updates).toEqual([{ "system.scores.con.value": 20 }]);
  });

  it("shows the base score as plain text on a read-only sheet", () => {
    renderDialog(
      makeActor({ base: 12, total: 13, mod: 1, effects: [] }),
      false,
    );
    expect(container.querySelector("input")).toBeNull();
    expect(container.textContent).toContain("Base score12");
  });
});
