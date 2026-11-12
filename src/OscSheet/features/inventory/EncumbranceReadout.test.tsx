// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { EncumbranceReadout } from "@features/inventory/EncumbranceReadout";
import { MetaEyebrow } from "@features/actions/MetaEyebrow";
import type { EncumbranceVM } from "@domain/vm-types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// HeaderBand's fit-to-width hook observes resize; jsdom has no ResizeObserver.
(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const enc: EncumbranceVM = {
  enabled: true,
  variant: "basic",
  value: 700,
  max: 1600,
  pct: 700 / 1600,
  tier: 2,
  status: "Heavily encumbered",
  label: "700 / 1600 cn",
  moveBands: { encounter: 30, explore: 90, travel: 18 },
  bands: [25, 37.5, 50],
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

/** The popover rows as "label|value" pairs — the tooltip's whole visible content.
    Rate rows split the value into number + unit cells; the status row keeps a `.vv`. */
function tooltipRows(scope: HTMLElement): string[] {
  return [...scope.querySelectorAll('[data-testid="move-pop"] .r')].map((r) => {
    const k = r.querySelector(".k")?.textContent;
    const vv = r.querySelector(".vv")?.textContent;
    const v =
      vv ?? `${r.querySelector(".num")?.textContent} ${r.querySelector(".unit")?.textContent}`;
    return `${k}|${v}`;
  });
}

describe("EncumbranceReadout", () => {
  it("shows the numeric load AND the terse rates above the bar", () => {
    act(() => root.render(<EncumbranceReadout e={enc} />));
    const readout = container.querySelector(".osc-enc-readout")!;
    // load number is restored (was removed in the first pass)
    expect(readout.querySelector(".load")?.textContent).toBe("700 / 1600 cn");
    // rates are terse: 30ft / 90ft / 18mi (encounter / explore / travel), no /turn suffixes
    const rates = [...readout.querySelectorAll(".rate")].map((r) => r.textContent);
    expect(rates).toEqual(["30ft", "90ft", "18mi"]);
  });

  it("renders the SAME tooltip rows as the header Move hover", () => {
    act(() => root.render(<EncumbranceReadout e={enc} />));
    const encRows = tooltipRows(container);

    act(() => root.render(<MetaEyebrow moveBands={enc.moveBands} encumbrance={enc} />));
    const moveRows = tooltipRows(container);

    // one shared component ⇒ byte-identical rows in both places
    expect(encRows).toEqual(moveRows);
    expect(encRows).toEqual([
      "Encumbrance|Heavily encumbered",
      "Encounter|30 ft",
      "Explore|90 ft",
      "Travel|18 mi",
    ]);
  });
});

