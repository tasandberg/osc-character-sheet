// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import OscSheetProvider from "@app/OscSheetProvider";
import { GrantingItemHeader, IdentitySection } from "./IdentitySection";
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

const elf = () => ownedItem({ name: "Elf", type: "race", system: {} });

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
  g.game = {
    user: { isGM: true },
    i18n: { has: () => false, localize: (key: string) => key },
  };
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
        {actor.system.classes.length ? (
          [...actor.system.classes, actor.system.race]
            .filter(Boolean)
            .map((item) => (
              <GrantingItemHeader
                key={(item as { name: string }).name}
                item={item as never}
                missingAbilities
                expanded
                onToggle={() => {}}
              />
            ))
        ) : (
          <IdentitySection />
        )}
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

describe("Class and race headers", () => {
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

  it("lets a class without a level table edit next-level XP and Hit Dice on the actor", async () => {
    const actor = makeActor({
      classes: [ownedItem(classItem("Witch", 1, 0, []) as object)],
    });
    await render(actor);

    edit("Next level XP", "3000");
    edit("Hit Dice", "2d6");

    expect(actor.update).toHaveBeenCalledWith({
      "system.details.xp.next": 3000,
    });
    expect(actor.update).toHaveBeenCalledWith({ "system.hp.hd": "2d6" });
  });

  it("hides the add-abilities action when OSE cannot offer abilities", async () => {
    await render(makeActor({ classes: [fighter()] }));

    expect(button("Add missing abilities for Fighter")).toBeUndefined();
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

  it("reads next-level XP from the class table, not the stored value", async () => {
    g.CONFIG = {
      OSE: {
        classes: {
          classic: {
            Fighter: {
              levels: [
                { xp: 0, hd: "1d8", thac0: 19, saves: [12, 13, 14, 15, 16] },
                { xp: 2000, hd: "2d8", thac0: 19, saves: [12, 13, 14, 15, 16] },
              ],
            },
          },
        },
      },
    };
    const actor = makeActor();
    actor.system.details.xp.next = 999;
    try {
      await render(actor);
      expect(container.textContent).toContain("/ 2,000");
      expect(container.textContent).not.toContain("999");
    } finally {
      g.CONFIG = { OSE: { classes: { classic: {} } } };
    }
  });

  it("lets a custom class edit its next-level XP", async () => {
    const actor = makeActor();
    await render(actor);

    edit("Next level XP", "3000");

    expect(actor.update).toHaveBeenCalledWith({
      "system.details.xp.next": 3000,
    });
  });

  it("lets only the GM change the class", async () => {
    g.game = { user: { isGM: false } };
    await render(makeActor());

    expect(container.querySelector("[role=combobox]")).toBeNull();
    expect(container.textContent).toContain("Fighter");
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

  expect(container.textContent).toContain("Elf Fighter 1");
});

it("opens the race and class items from the sheet header", () => {
  const actor = makeActor({ classes: [fighter()], race: elf() }) as unknown as OSEActor;
  const opened: string[] = [];
  act(() =>
    root.render(
      <Identity identity={selectIdentity(actor)} onOpenItem={(id) => opened.push(id)} />,
    ),
  );

  act(() => button("Fighter 1")?.click());
  act(() => button("Elf")?.click());

  expect(opened).toHaveLength(2);
});

it("gives each class its own level in the sheet header", () => {
  const thief = ownedItem(classItem("Thief", 2, 0, ROWS) as object);
  const actor = makeActor({ classes: [fighter(), thief] }) as unknown as OSEActor;
  act(() => root.render(<Identity identity={selectIdentity(actor)} />));

  expect(container.textContent).toContain("Fighter 1 / Thief 2 · Veteran");
});
