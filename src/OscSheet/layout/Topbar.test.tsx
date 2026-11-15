// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Topbar } from "@layout/Topbar";
import type { TopbarVM } from "@domain/vm-types";
import { selectTopbar } from "@domain/topbar";
import type { OSEActor, OseClassItem } from "@domain/types";
import { raistlin } from "@src/OscSheet/__fixtures__/raistlin";
import { classItem, levelRow } from "@src/OscSheet/__fixtures__/classItem";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const vm: TopbarVM = {
  level: 3,
  nextLevel: 4,
  xp: { value: 6420, floor: 5000, next: 10000 },
  pct: 28.4,
  levelUps: [],
  classTracks: [],
};

// Map-backed game.settings so getThemeSetting/getFontScaleSetting read a real
// value and the setters have something to write to.
const store = new Map<string, unknown>([["osc-character-sheet.theme", "dark"]]);
const set = vi.fn((ns: string, key: string, value: unknown) => {
  store.set(`${ns}.${key}`, value);
  return Promise.resolve(value);
});

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  set.mockClear();
  (globalThis as { game?: unknown }).game = {
    settings: { get: (ns: string, key: string) => store.get(`${ns}.${key}`), set },
  };
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete (globalThis as { game?: unknown }).game;
});

const q = (sel: string) => container.querySelector<HTMLElement>(sel);
const byText = (sel: string, text: string) =>
  [...container.querySelectorAll<HTMLElement>(sel)].find((el) => el.textContent === text);

describe("Topbar XP band", () => {
  it("shows the current level's XP floor beside the level", () => {
    act(() => root.render(<Topbar vm={vm} onEdit={() => {}} />));
    expect(byText("span", "5,000")).toBeTruthy();
  });

  it("renders without a next level when the actor has no next-level XP", () => {
    const maxed: TopbarVM = { ...vm, nextLevel: null, xp: { ...vm.xp, next: null }, pct: 100 };
    act(() => root.render(<Topbar vm={maxed} onEdit={() => {}} />));
    expect(byText("span", "6,420 XP")).toBeTruthy();
    expect(container.textContent).not.toContain("Lv 4");
  });
});

describe("Topbar settings", () => {
  it("renders a cog trigger and no theme/font controls until opened", () => {
    act(() => root.render(<Topbar vm={vm} onEdit={() => {}} />));
    expect(q('[aria-label="Settings"] .fa-gear')).toBeTruthy();
    expect(q(".modal")).toBeNull();
  });

  it("opens the settings modal on cog click", () => {
    act(() => root.render(<Topbar vm={vm} onEdit={() => {}} />));
    act(() => q('[aria-label="Settings"]')!.click());
    expect(q(".modal-head .ttl")?.textContent).toBe("Preferences");
    // both settings groups present
    expect(q('[aria-label="Theme"]')).toBeTruthy();
    expect(q('[aria-label="Font size"]')).toBeTruthy();
  });

  it("closes the modal via the Close footer button", () => {
    act(() => root.render(<Topbar vm={vm} onEdit={() => {}} />));
    act(() => q('[aria-label="Settings"]')!.click());
    expect(q(".modal")).toBeTruthy();
    act(() => byText(".modal-foot button", "Close")!.click());
    expect(q(".modal")).toBeNull();
  });

  it("writes the theme and font-size settings from the modal controls", () => {
    act(() => root.render(<Topbar vm={vm} onEdit={() => {}} />));
    act(() => q('[aria-label="Settings"]')!.click());

    act(() => byText('[role="radiogroup"][aria-label="Theme"] label', "Light")!.click());
    expect(set).toHaveBeenCalledWith("osc-character-sheet", "theme", "cream");

    act(() => byText('[role="radiogroup"][aria-label="Font size"] label', "Large")!.click());
    expect(set).toHaveBeenCalledWith("osc-character-sheet", "fontScale", "large");
  });

  it("defaults spell images on and writes the checkbox", () => {
    act(() => root.render(<Topbar vm={vm} onEdit={() => {}} />));
    act(() => q('[aria-label="Settings"]')!.click());

    const checkbox = container.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    expect(checkbox.checked).toBe(true);
    act(() => checkbox.click());
    expect(set).toHaveBeenCalledWith("osc-character-sheet", "showSpellImages", false);
  });
});

describe("Topbar level up", () => {
  const fighterAt = (xp: number) =>
    classItem("Fighter", 1, xp, [
      levelRow(0, "1d8", 19, [12, 13, 14, 15, 16]),
      levelRow(2000, "2d8", 19, [12, 13, 14, 15, 16]),
    ]);
  const actorWith = (fighter: OseClassItem) =>
    ({
      ...raistlin,
      system: { ...raistlin.system, classes: [fighter] },
      levelUp: vi.fn(),
    }) as unknown as OSEActor & { levelUp: ReturnType<typeof vi.fn> };
  const renderFor = (actor: ReturnType<typeof actorWith>) =>
    act(() =>
      root.render(
        <Topbar
          vm={selectTopbar(actor)}
          onEdit={() => {}}
          onLevelUpClass={(c) => actor.levelUp(c)}
        />,
      ),
    );
  const levelUpLink = () =>
    [...container.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Level up");

  it("levels up a class item that has reached its next level's XP", () => {
    const fighter = fighterAt(2100);
    const actor = actorWith(fighter);
    renderFor(actor);
    act(() => levelUpLink()!.click());
    expect(actor.levelUp).toHaveBeenCalledWith(fighter);
  });

  it("offers no level up before the class reaches its next level's XP", () => {
    renderFor(actorWith(fighterAt(1500)));
    expect(levelUpLink()).toBeUndefined();
  });
});

describe("Topbar multiclass XP", () => {
  const rows = (...xp: number[]) => xp.map((x) => levelRow(x, "1d8", 19, [12, 13, 14, 15, 16]));
  const actorWith = (classes: OseClassItem[]) =>
    ({ ...raistlin, system: { ...raistlin.system, classes } }) as unknown as OSEActor;
  const renderFor = (classes: OseClassItem[]) =>
    act(() => root.render(<Topbar vm={selectTopbar(actorWith(classes))} onEdit={() => {}} />));
  const switcher = () => container.querySelector<HTMLButtonElement>('button[aria-label^="XP for"]');

  it("switches the bar between each class's own XP track", () => {
    renderFor([
      classItem("Fighter", 2, 2500, rows(0, 2000, 4000)),
      classItem("Magic-User", 1, 2500, rows(0, 2500)),
    ]);
    expect(switcher()!.getAttribute("aria-label")).toBe("XP for Fighter. Show Magic-User");
    expect(byText(".next b", "Lv 3")).toBeTruthy();
    expect(byText(".next span", "4,000")).toBeTruthy();

    act(() => switcher()!.click());
    expect(switcher()!.getAttribute("aria-label")).toBe("XP for Magic-User. Show Fighter");
    expect(byText(".next b", "Lv 2")).toBeTruthy();
    expect(byText(".next span", "2,500")).toBeTruthy();
  });

  it("offers no class switch for a single class", () => {
    renderFor([classItem("Fighter", 1, 0, rows(0, 2000))]);
    expect(switcher()).toBeNull();
  });
});
