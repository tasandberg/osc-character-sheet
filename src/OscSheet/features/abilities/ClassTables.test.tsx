// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import OscSheetProvider from "@app/OscSheetProvider";
import type { OSEActor } from "@domain/types";
import { classItem, levelRow } from "@src/OscSheet/__fixtures__/classItem";
import en from "../../../../lang/en.json";
import { ClassTables } from "./ClassTables";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const g = globalThis as Record<string, unknown>;
const OSE_301: Record<string, string> = {
  "OSE.details.level": "Level",
  "OSE.HitDice": "Hit Dice",
  "OSE.scores.con.short": "CON",
  "OSE.Thac0": "THAC0",
  "OSE.AB": "Attack Bonus",
  "OSE.saves.death.short": "D",
  "OSE.saves.wand.short": "W",
  "OSE.saves.paralysis.short": "P",
  "OSE.saves.breath.short": "B",
  "OSE.saves.spell.short": "S",
};
const lookup = (key: string) =>
  OSE_301[key] ??
  key
    .split(".")
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      en,
    );
g.foundry = { utils: { debounce: (fn: unknown) => fn } };
g.CONFIG = { OSE: { classes: { classic: {} } } };
g.game = {
  user: { isGM: true },
  i18n: {
    has: (key: string) => typeof lookup(key) === "string",
    localize: (key: string) => (lookup(key) as string | undefined) ?? key,
  },
};

const SAVES: [number, number, number, number, number] = [12, 13, 14, 15, 16];

const fighter = classItem("Fighter", 2, 2500, [
  levelRow(0, "1d8", 19, SAVES),
  levelRow(2000, "2d8", 19, SAVES),
  levelRow(4000, "3d8", 17, SAVES),
]);

const cleric = classItem("Cleric", 1, 0, [
  levelRow(0, "1d6", 19, SAVES),
  levelRow(1500, "2d6", 19, SAVES, { "1": 1 }),
]);

const witch = classItem("Witch", 1, 0, []);

const actor = (classes: object[]) =>
  ({
    id: "self",
    name: "Test",
    system: {
      details: { class: "Fighter", level: 1, xp: { value: 0, next: 0 } },
      classes,
      race: null,
    },
    items: { contents: [] },
  }) as unknown as OSEActor;

let container: HTMLDivElement;
let root: Root;
const connector = { onUpdate: () => {}, tearDown: () => {} } as never;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = (a: OSEActor) =>
  act(() =>
    root.render(
      <OscSheetProvider
        initialActor={a}
        source={a}
        contextConnector={connector}
        canEdit
        canViewFullSheet
      >
        <ClassTables />
      </OscSheetProvider>,
    ),
  );

const expand = (name: string) =>
  act(() =>
    container
      .querySelector<HTMLButtonElement>(
        `[aria-label="Show ${name} Progression"]`,
      )!
      .click(),
  );

const rowText = (row: Element) =>
  [...row.querySelectorAll("th, td")].map((c) => c.textContent);

describe("ClassTables", () => {
  it("starts collapsed and expands to the level table with the current level marked", async () => {
    await render(actor([fighter]));
    expect(container.querySelector("table")).toBeNull();

    await expand("Fighter");

    expect(rowText(container.querySelector("thead tr")!)).toEqual([
      "Level",
      "XP",
      "Hit Dice",
      "CON",
      "THAC0",
      "Attack Bonus",
      "D",
      "W",
      "P",
      "B",
      "S",
    ]);
    const current = container.querySelector('tr[aria-current="true"]')!;
    expect(rowText(current)).toEqual([
      "2",
      "2,000",
      "2d8",
      "",
      "19",
      "0",
      "12",
      "13",
      "14",
      "15",
      "16",
    ]);
  });

  it("adds a column for each spell level the class ever gets slots for", async () => {
    await render(actor([cleric]));
    await expand("Cleric");

    const headers = rowText(container.querySelector("thead tr")!);
    expect(headers.slice(-2)).toEqual(["S", "1"]);
  });

  it("shows one table per class that has a level table", async () => {
    await render(actor([fighter, witch]));

    const titles = [...container.querySelectorAll("section")].map((s) =>
      s.getAttribute("aria-label"),
    );
    expect(titles).toEqual(["Fighter Progression"]);
  });

  it("shows no table for a character without class items", async () => {
    await render(actor([]));

    expect(container.querySelector("section")).toBeNull();
  });
});
