// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import OscSheetProvider from "@app/OscSheetProvider";
import type { OSEActor } from "@domain/types";
import { classItem } from "@src/OscSheet/__fixtures__/classItem";
import en from "../../../../lang/en.json";
import Abilities from "./AbilitiesView";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const OSE_301: Record<string, string> = {
  "OSE.details.class": "Class",
};
const lookup = (key: string) =>
  OSE_301[key] ??
  key
    .split(".")
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      en,
    );

const LINKED: Record<string, { name: string; system: object }> = {
  "Compendium.ose.abilities.Item.backstab": {
    name: "Back-stab",
    system: { requirements: "Thief" },
  },
  "Compendium.ose.abilities.Item.climb": {
    name: "Climb Sheer Surfaces",
    system: { requirements: "Thief" },
  },
  "Compendium.ose.abilities.Item.infravision": {
    name: "Infravision",
    system: { requirements: "Elf" },
  },
};

const g = globalThis as Record<string, unknown>;
g.foundry = {
  utils: { debounce: (fn: unknown) => fn },
  applications: { ux: { TextEditor: { enrichHTML: async (h: string) => h } } },
};
g.Roll = { validate: () => true };
g.CONFIG = { OSE: { classes: { classic: {} } } };
g.ResizeObserver = class {
  observe() {}
  disconnect() {}
};
g.fromUuid = async (uuid: string) => LINKED[uuid] ?? null;
g.game = {
  system: { id: "ose" },
  user: { isGM: true },
  i18n: {
    has: (key: string) => typeof lookup(key) === "string",
    localize: (key: string) => (lookup(key) as string | undefined) ?? key,
  },
};

const owned = <T extends object>(item: T, type: string, extra: object = {}) =>
  Object.assign(item, { id: (item as { name: string }).name, type }, extra);

const withLinks = <T extends { system: object }>(item: T, uuids: string[]) => {
  Object.assign(item.system, {
    key: (item as unknown as { name: string }).name.toLowerCase(),
    abilities: uuids.map((uuid) => ({ uuid, level: 1 })),
  });
  return item;
};

const thief = () =>
  owned(
    withLinks(classItem("Thief", 1, 0, []), [
      "Compendium.ose.abilities.Item.backstab",
      "Compendium.ose.abilities.Item.climb",
    ]),
    "class",
  );

const elf = () =>
  owned({ name: "Elf", system: { key: "elf", abilities: [] } }, "race");

const ability = (
  name: string,
  {
    requirements = "",
    grantedBy,
    source,
  }: { requirements?: string; grantedBy?: object; source?: string } = {},
) => ({
  _id: name,
  name,
  img: "",
  flags: grantedBy ? { ose: { grantedBy } } : {},
  _stats: { compendiumSource: source ?? null },
  system: { description: "", requirements, roll: "" },
});

const actor = (classes: object[], abilities: object[] = [], race?: object) =>
  ({
    id: "self",
    name: "Test",
    img: "",
    system: {
      details: {
        class: "Fighter",
        level: 1,
        xp: { value: 0, next: 0, bonus: 0 },
      },
      classes,
      race: race ?? null,
      hp: { hd: "1d8" },
      languages: { value: [] },
      scores: {},
      abilities: Object.fromEntries(
        abilities.map((a) => [(a as { _id: string })._id, a]),
      ),
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
  act(async () =>
    root.render(
      <OscSheetProvider
        initialActor={a}
        source={a}
        contextConnector={connector}
        canEdit
        canViewFullSheet
      >
        <Abilities />
      </OscSheetProvider>,
    ),
  );

const section = (title: string) =>
  container.querySelector(`section[aria-label="${title}"]`);

const sectionText = (title: string) => section(title)?.textContent ?? "";

describe("Abilities tab with class items", () => {
  it("nests granted abilities under their class or race and the rest under Other abilities", async () => {
    await render(
      actor(
        [thief()],
        [
          ability("Wall Climbing", {
            source: "Compendium.ose.abilities.Item.climb",
          }),
          ability("Infravision", { grantedBy: { type: "race", key: "elf" } }),
          ability("Lucky Charm"),
        ],
        elf(),
      ),
    );

    expect(sectionText("Thief")).toContain("ClassLevel 1");
    expect(sectionText("Thief")).toContain("Wall Climbing");
    expect(sectionText("Elf")).toContain("Race");
    expect(sectionText("Elf")).toContain("Infravision");
    expect(sectionText("Other abilities")).toContain("Lucky Charm");
    expect(sectionText("Other abilities")).not.toContain("Infravision");
  });

  it("matches an untagged ability to its class by name and requirements", async () => {
    await render(
      actor([thief()], [ability("back-stab ", { requirements: "thief" })]),
    );

    expect(sectionText("Thief")).toContain("back-stab");
    expect(sectionText("Other abilities")).not.toContain("back-stab");
  });

  it("files an ability by its grantedBy flag even when its name matches another class's link", async () => {
    await render(
      actor(
        [thief()],
        [
          ability("Back-stab", {
            requirements: "Thief",
            grantedBy: { type: "class", key: "assassin" },
          }),
        ],
      ),
    );

    expect(sectionText("Thief")).not.toContain("Back-stab");
    expect(sectionText("Other abilities")).toContain("Back-stab");
  });
});

describe("Collapsing a section", () => {
  it("leads the item's row with a chevron that hides and shows its abilities", async () => {
    await render(
      actor([thief()], [ability("Back-stab", { requirements: "Thief" })]),
    );
    const chevron = () =>
      section("Thief")!.querySelector<HTMLButtonElement>(
        "button[aria-expanded]",
      )!;
    expect(section("Thief")!.querySelector("button")).toBe(chevron());
    expect(chevron().getAttribute("aria-label")).toBe(
      "Collapse Thief abilities",
    );

    await act(async () => chevron().click());

    expect(chevron().getAttribute("aria-expanded")).toBe("false");
    expect(sectionText("Thief")).not.toContain("Back-stab");

    await act(async () => chevron().click());

    expect(sectionText("Thief")).toContain("Back-stab");
  });
});

describe("Add missing abilities", () => {
  const offering = (abilities: object[]) =>
    Object.assign(actor([thief()], abilities), {
      offerAbilities: vi.fn(async () => undefined),
    });
  const addLink = () =>
    container.querySelector('[aria-label="Add missing abilities for Thief"]');

  it("offers the class's missing abilities through OSE", async () => {
    const a = offering([ability("Back-stab", { requirements: "Thief" })]);
    await render(a);

    await act(async () => (addLink() as HTMLButtonElement).click());

    expect(a.offerAbilities).toHaveBeenCalledWith(a.system.classes![0], 1, {
      upTo: true,
      confirm: true,
    });
  });

  it("offers a race's missing abilities at level 1", async () => {
    const race = withLinks(elf(), [
      "Compendium.ose.abilities.Item.infravision",
    ]);
    const a = Object.assign(
      actor(
        [thief()],
        [
          ability("Back-stab", { requirements: "Thief" }),
          ability("Climb Sheer Surfaces", { requirements: "Thief" }),
        ],
        race,
      ),
      { offerAbilities: vi.fn(async () => undefined) },
    );
    await render(a);

    await act(async () =>
      (
        container.querySelector(
          '[aria-label="Add missing abilities for Elf"]',
        ) as HTMLButtonElement
      ).click(),
    );

    expect(a.offerAbilities).toHaveBeenCalledWith(race, 1, {
      upTo: true,
      confirm: true,
    });
  });

  it("hides the link when the character already has every ability up to its level", async () => {
    await render(
      offering([
        ability("Back-stab", { requirements: "Thief" }),
        ability("Wall Climbing", {
          source: "Compendium.ose.abilities.Item.climb",
        }),
      ]),
    );

    expect(addLink()).toBeNull();
  });
});

describe("Abilities tab without class items", () => {
  it("keeps one flat Abilities list", async () => {
    await render(
      actor([], [ability("Turn Undead", { requirements: "Cleric" })]),
    );

    expect(sectionText("Abilities")).toContain("Turn Undead");
    expect(section("Other abilities")).toBeNull();
  });
});
