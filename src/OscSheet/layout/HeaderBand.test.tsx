// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { HeaderBand } from "@layout/HeaderBand";
import type { IdentityVM, VitalsVM } from "@domain/vm-types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
(globalThis as { game?: unknown }).game = {
  i18n: { localize: (k: string) => k },
};
(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
  observe() {}
  disconnect() {}
};

const identity: IdentityVM = {
  name: "Brakka",
  img: "",
  classLabel: "Fighter / Magic-User",
  classLevels: "Fighter 2 / Magic-User 2",
  level: 2,
  alignment: "Neutral",
  title: "",
  isRetainer: false,
  wage: "",
};

const vitals = (o: Partial<VitalsVM> = {}): VitalsVM => ({
  hp: { value: 6, max: 9 },
  ac: { value: 7, ascending: false },
  initMod: 0,
  hd: "2d8 / 1d4",
  move: 120,
  moveBands: { encounter: 40, explore: 120, travel: 24 },
  ...o,
});

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

const render = (v: VitalsVM) =>
  act(() => root.render(<HeaderBand identity={identity} vitals={v} />));
const tooltips = () =>
  [...container.querySelectorAll('[role="tooltip"]')].map((t) => t.textContent);

describe("HeaderBand multiclass vitals", () => {
  it("names the class behind each part of a multiclass HD", () => {
    render(
      vitals({
        hdParts: [
          { name: "Fighter", hd: "2d8" },
          { name: "Magic-User", hd: "1d4" },
        ],
      }),
    );
    expect(container.querySelector('[aria-label="Fighter: 2d8"]')).toBeTruthy();
    expect(container.querySelector('[aria-label="Magic-User: 1d4"]')).toBeTruthy();
    expect(tooltips()).toEqual(expect.arrayContaining(["Fighter", "Magic-User"]));
  });
});
