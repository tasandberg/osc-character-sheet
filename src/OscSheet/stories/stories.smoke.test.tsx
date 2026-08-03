// @vitest-environment jsdom
// Storybook's build only bundles the stories — it never mounts them, so a story
// that throws on render still ships a green build. Mount every one for real.
import { describe, expect, it } from "vitest";
import { act, createElement, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import "../../../.storybook/foundry-stub";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom has no ResizeObserver; the header band measures itself with one.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const modules = import.meta.glob<Record<string, unknown>>("../**/*.stories.tsx", { eager: true });

const stories = Object.entries(modules).flatMap(([path, mod]) =>
  Object.entries(mod)
    .filter(([name, value]) => name !== "default" && typeof value === "function")
    .map(
      ([name, value]) =>
        [
          `${path.replace(/^\.\.\/|\.stories\.tsx$/g, "")} / ${name}`,
          value as ComponentType,
        ] as const,
    ),
);

describe("stories", () => {
  // The 2026 conversion defect survived every gate partly because the broken
  // slice was the unphotographed one. Each tab body needs a story of its own.
  it("gives every tab body a whole-tab story", () => {
    const titles = Object.values(modules).map(
      (m) => (m.default as { title?: string } | undefined)?.title ?? "",
    );
    for (const tab of ["Tabs / Actions", "Tabs / Abilities", "Tabs / Spells", "Tabs / Notes"])
      expect(titles).toContain(tab);
    expect(titles).toContain("Inventory / InventoryView");
  });

  it("finds a non-trivial number of stories to mount", () => {
    expect(stories.length).toBeGreaterThan(60);
  });

  // Stories are components, not thunks — several use hooks, so they have to be
  // rendered rather than called.
  it.each(stories)("%s renders", async (_name, Story) => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(createElement(Story));
    });
    // A story that renders nothing is as broken as one that throws. Element
    // count, not text: pips, bars and icon buttons are deliberately textless.
    expect(host.querySelectorAll("*").length).toBeGreaterThan(0);
    await act(async () => root.unmount());
    host.remove();
  });
});
