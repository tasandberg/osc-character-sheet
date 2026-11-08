// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import OscSheetProvider from "@app/OscSheetProvider";
import { EffectsModal } from "./EffectsModal";
import type { OSEActor, OscContext } from "@domain/types";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const STRINGS: Record<string, string> = {
  "OSE.category.effects": "Effects",
  "OSE.effects.temporary": "Temporary Effects",
  "OSE.effects.passive": "Passive Effects",
  "OSE.effects.inactive": "Inactive Effects",
  "OSE.effects.Actor": "Actor",
  "OSE.effects.None": "None",
  "OSE.effects.Create": "Create effect",
  "OSE.effects.Fixed": "Worked out from the class and ability scores.",
  "OSE.effects.FromItem": "Granted by an item. Remove the item instead.",
  "OSE.effects.ClassXp": "Prime requisite XP {bonus}%",
  "OSE.Delete": "Delete",
  "COMBAT.Rounds": "Rounds",
  "COMMON.None": "None",
};

const g = globalThis as Record<string, unknown>;
g.foundry = { utils: { debounce: (fn: unknown) => fn } };
g.game = {
  i18n: {
    localize: (k: string) => STRINGS[k] ?? k,
    format: (k: string, data: Record<string, string>) =>
      (STRINGS[k] ?? k).replace(/\{(\w+)\}/g, (_, n) => data[n]),
  },
};

type FakeEffect = {
  name: string;
  disabled?: boolean;
  isTemporary?: boolean;
  parent?: { name: string };
  duration?: Record<string, unknown>;
};

function makeActor(effects: FakeEffect[], classes: unknown[] = []) {
  const actor: Record<string, unknown> = {
    name: "Brakka",
    items: { contents: [] },
    system: { classes, classXpBonus: () => 10 },
    allApplicableEffects: () =>
      effects.map((e, i) => ({
        uuid: `Effect.${i}`,
        img: "icons/svg/aura.svg",
        disabled: false,
        isTemporary: false,
        parent: actor,
        ...e,
      })),
  };
  return actor as unknown as OSEActor;
}

let container: HTMLDivElement;
let root: Root;
let publish: (context: OscContext) => void;
const connector = {
  onUpdate: (fn: (context: OscContext) => void) => {
    publish = fn;
  },
  tearDown: () => {},
} as never;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const renderModal = (actor: OSEActor, canEdit = true) =>
  act(() =>
    root.render(
      <OscSheetProvider
        initialActor={actor}
        source={actor}
        contextConnector={connector}
        canEdit={canEdit}
        canViewFullSheet
      >
        <EffectsModal open onClose={() => {}} />
      </OscSheetProvider>,
    ),
  );

const group = (label: string) =>
  container.querySelector<HTMLElement>(`section[aria-label="${label}"]`)!;
const rowTexts = (label: string) =>
  [...group(label).querySelectorAll("li")].map((row) =>
    [...row.children].slice(0, 3).map((cell) => cell.textContent),
  );
const button = (label: string) =>
  container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);

describe("EffectsModal", () => {
  it("groups effects into temporary, passive and inactive, sorted by name, with source and duration", () => {
    renderModal(
      makeActor([
        { name: "Haste", isTemporary: true, duration: { rounds: 3 } },
        { name: "Bless", isTemporary: true, duration: { rounds: 6 } },
        { name: "Ring of Protection", parent: { name: "Ring" } },
        { name: "Curse", disabled: true },
      ]),
    );

    expect(
      [...container.querySelectorAll("section")].map((t) =>
        t.getAttribute("aria-label"),
      ),
    ).toEqual(["Temporary Effects", "Passive Effects", "Inactive Effects"]);
    expect(rowTexts("Temporary Effects")).toEqual([
      ["Bless", "Actor", "6 Rounds"],
      ["Haste", "Actor", "3 Rounds"],
    ]);
    expect(rowTexts("Passive Effects")).toEqual([
      ["Ring of Protection", "Ring", ""],
    ]);
    expect(rowTexts("Inactive Effects")).toEqual([["Curse", "Actor", ""]]);
  });

  it("shows None for a group with no effects", () => {
    renderModal(makeActor([]));
    expect(group("Passive Effects").querySelector("li")?.textContent).toBe(
      "None",
    );
  });

  it("locks deletion of an effect granted by an item", () => {
    renderModal(makeActor([{ name: "Glow", parent: { name: "Torch" } }]));
    expect(
      button("Granted by an item. Remove the item instead.")?.disabled,
    ).toBe(true);
    expect(button("Delete")).toBeNull();
  });

  it("shows the class XP adjustment as a fixed effect with no controls", () => {
    renderModal(
      makeActor(
        [],
        [{ uuid: "Item.cls", name: "Fighter", img: "fighter.webp" }],
      ),
    );
    expect(rowTexts("Passive Effects")).toEqual([
      ["Prime requisite XP +10%", "Fighter", ""],
    ]);
    expect(
      container.querySelector(
        '[role="img"][aria-label="Worked out from the class and ability scores."]',
      ),
    ).not.toBeNull();
    expect(group("Passive Effects").querySelectorAll("button")).toHaveLength(1);
  });

  it("offers no create or effect controls on a read-only sheet", () => {
    renderModal(makeActor([{ name: "Bless" }]), false);
    expect(container.textContent).not.toContain("Create effect");
    expect(button("Delete")).toBeNull();
  });

  it("updates when the actor's effects change", () => {
    renderModal(makeActor([]));
    act(() =>
      publish({
        document: makeActor([{ name: "Shield" }]),
        isEditable: true,
      } as unknown as OscContext),
    );
    expect(rowTexts("Passive Effects")).toEqual([["Shield", "Actor", ""]]);
  });
});
