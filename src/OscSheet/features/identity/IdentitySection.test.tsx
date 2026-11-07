// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import OscSheetProvider from "@app/OscSheetProvider";
import { IdentitySection } from "./IdentitySection";
import { Identity } from "@layout/Identity";
import { selectIdentity } from "@domain/identity";
import type { OSEActor } from "@domain/types";
import { classItem, levelRow } from "@src/OscSheet/__fixtures__/classItem";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const g = globalThis as Record<string, unknown>;
g.foundry = { utils: { debounce: (fn: unknown) => fn } };
g.Roll = { validate: (formula: string) => /^\d*d\d+$/.test(formula) };
g.CONFIG = { OSE: { classes: { classic: {} } } };
g.ResizeObserver = class {
  observe() {}
  disconnect() {}
};

const ROWS = [
  levelRow(0, "1d8", 19, [12, 13, 14, 15, 16]),
  levelRow(2000, "2d8", 19, [12, 13, 14, 15, 16]),
];

const ownedItem = <T extends object>(item: T) =>
  Object.assign(item, {
    id: (item as { name: string }).name,
    update: vi.fn(async () => undefined),
    sheet: { render: vi.fn() },
  });

const fighter = (xp = 0) =>
  ownedItem(classItem("Fighter", 1, xp, ROWS) as object);

const elf = () => ownedItem({ name: "Elf", system: {} });

type ActorOpts = { classes?: object[]; race?: object | null };

function makeActor({ classes = [], race = null }: ActorOpts = {}) {
  return {
    id: "self",
    name: "Test",
    img: "",
    system: {
      details: {
        class: "Fighter",
        title: "Veteran",
        alignment: "Neutral",
        level: 1,
        xp: { value: 0, next: 2000, bonus: 0 },
      },
      classes,
      race,
      classXpBonus: () => 10,
      xpBonusFromEffects: 0,
      hp: { hd: "1d8" },
      retainer: { enabled: false },
    },
    items: { contents: [] },
    update: vi.fn(async () => undefined),
    levelUp: vi.fn(async () => undefined),
    removeGrantingItem: vi.fn(async () => undefined),
  };
}

let container: HTMLDivElement;
let root: Root;
const connector = { onUpdate: vi.fn(), tearDown: vi.fn() } as never;

beforeEach(() => {
  g.game = { user: { isGM: true } };
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = (actor: ReturnType<typeof makeActor>, canEdit = true) =>
  act(() =>
    root.render(
      <OscSheetProvider
        initialActor={actor as unknown as OSEActor}
        source={actor as unknown as OSEActor}
        contextConnector={connector}
        canEdit={canEdit}
        canViewFullSheet
      >
        <IdentitySection />
      </OscSheetProvider>,
    ),
  );

const button = (name: string) =>
  [...container.querySelectorAll("button, [role=button]")].find(
    (b) =>
      b.getAttribute("aria-label") === name || b.textContent?.trim() === name,
  ) as HTMLElement | undefined;

function edit(label: string, typed: string) {
  act(() => button(`Edit ${label}`)!.click());
  const field = container.querySelector<HTMLElement>("[role=textbox]")!;
  act(() => {
    field.textContent = typed;
    field.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
  });
}

describe("IdentitySection with class items", () => {
  it("writes level and XP to the class item", async () => {
    const cls = fighter();
    const actor = makeActor({ classes: [cls] });
    await render(actor);

    edit("Fighter level", "2");
    edit("Fighter XP", "1500");

    expect(cls.update).toHaveBeenCalledWith({ "system.level": 2 });
    expect(cls.update).toHaveBeenCalledWith({ "system.xp": 1500 });
    expect(actor.update).not.toHaveBeenCalled();
  });

  it("shows the next level's XP and the XP bonus", async () => {
    await render(makeActor({ classes: [fighter()] }));

    expect(container.textContent).toContain("/ 2,000");
    expect(container.textContent).toContain("+10%");
  });

  it("offers a level up once the class can level", async () => {
    const cls = fighter(2500);
    const actor = makeActor({ classes: [cls] });
    await render(actor);

    await act(async () => button("Level up Fighter")!.click());

    expect(actor.levelUp).toHaveBeenCalledWith(cls);
  });

  it("opens the class item sheet from its name", async () => {
    const cls = fighter();
    await render(makeActor({ classes: [cls] }));

    await act(async () => button("Fighter")!.click());

    expect(cls.sheet.render).toHaveBeenCalledWith(true);
  });

  it("removes a class or race through OSE so granted abilities can go too", async () => {
    const cls = fighter();
    const race = elf();
    const actor = makeActor({ classes: [cls], race });
    await render(actor);

    await act(async () => button("Remove Fighter")!.click());
    await act(async () => button("Remove Elf")!.click());

    expect(actor.removeGrantingItem).toHaveBeenCalledWith(cls);
    expect(actor.removeGrantingItem).toHaveBeenCalledWith(race);
  });
});

describe("IdentitySection without class items", () => {
  it("writes level and XP to the actor", async () => {
    const actor = makeActor();
    await render(actor);

    edit("Level", "3");
    edit("XP", "4000");

    expect(actor.update).toHaveBeenCalledWith({ "system.details.level": 3 });
    expect(actor.update).toHaveBeenCalledWith({
      "system.details.xp.value": 4000,
    });
  });

  it("writes a valid Hit Dice formula to the actor and ignores an invalid one", async () => {
    const actor = makeActor();
    await render(actor);

    edit("Hit Dice", "nonsense");
    edit("Hit Dice", "2d8");

    expect(actor.update).toHaveBeenCalledTimes(1);
    expect(actor.update).toHaveBeenCalledWith({ "system.hp.hd": "2d8" });
  });

  it("lets only the GM change the class", async () => {
    g.game = { user: { isGM: false } };
    await render(makeActor());

    expect(
      container.querySelector<HTMLInputElement>("[role=combobox]")!.disabled,
    ).toBe(true);
  });
});

it("is read-only without edit permission", async () => {
  await render(makeActor({ classes: [fighter()], race: elf() }), false);

  expect(button("Edit Fighter level")).toBeUndefined();
  expect(button("Remove Fighter")).toBeUndefined();
  expect(button("Remove Elf")).toBeUndefined();
});

it("names the race in the sheet header", () => {
  const actor = makeActor({ race: elf() }) as unknown as OSEActor;
  act(() => root.render(<Identity identity={selectIdentity(actor)} />));

  expect(container.textContent).toContain("Elf · Fighter 1");
});
