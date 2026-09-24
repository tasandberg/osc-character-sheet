// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AbilityPlaques } from "@features/actions/AbilityPlaques";
import { Identity } from "@layout/Identity";
import type { AbilityVM, IdentityVM } from "@domain/vm-types";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const abilities: AbilityVM[] = [
  { key: "str", label: "STR", value: 9, mod: 0, modLabel: "+0" },
];
const identity: IdentityVM = {
  name: "Kip",
  img: "",
  classLabel: "Fighter",
  level: 1,
  alignment: "Lawful",
  title: "Veteran",
  isRetainer: false,
  wage: "",
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const abilityGrid = () =>
  container.querySelector<HTMLElement>(".osc-abilities")!;

describe("AbilityPlaques", () => {
  it("renders one plaque per ability and nothing else", () => {
    act(() => root.render(<AbilityPlaques abilities={abilities} />));
    expect(abilityGrid().children.length).toBe(abilities.length);
    expect(container.querySelector('[data-testid="loyalty"]')).toBeNull();
  });
});

describe("Identity standing line", () => {
  it("shows the title for a normal character", () => {
    act(() => root.render(<Identity identity={identity} />));
    expect(container.textContent).toContain("Fighter 1 · Veteran · Lawful");
  });

  it("keeps the title, not the wage, for a retainer", () => {
    act(() =>
      root.render(
        <Identity
          identity={{ ...identity, isRetainer: true, wage: "5gp/month" }}
        />,
      ),
    );
    expect(container.textContent).toContain("Fighter 1 · Veteran · Lawful");
    expect(container.textContent).not.toContain("Wage");
  });

  it("drops the slot entirely when there is no title", () => {
    act(() => root.render(<Identity identity={{ ...identity, title: "" }} />));
    expect(container.textContent).toContain("Fighter 1 · Lawful");
  });
});
