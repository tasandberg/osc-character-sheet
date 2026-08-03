// @vitest-environment jsdom
// Storybook's build only bundles the stories — it never mounts them, so a tab
// that throws on render still ships a green build. Mount each one for real.
import { describe, expect, it, beforeAll } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const modules = import.meta.glob<Record<string, unknown>>("./*.stories.tsx", { eager: true });

beforeAll(async () => {
  await import("../../../.storybook/foundry-stub");
});

const stories = Object.entries(modules).flatMap(([path, mod]) =>
  Object.entries(mod)
    .filter(([name, value]) => name !== "default" && typeof value === "function")
    .map(([name, value]) => [`${path.replace(/^\.\/|\.stories\.tsx$/g, "")} / ${name}`, value] as const),
);

describe("tab stories", () => {
  it("covers every tab", () => {
    const files = new Set(Object.keys(modules));
    expect([...files].sort()).toEqual([
      "./AbilitiesTab.stories.tsx",
      "./ActionsTab.stories.tsx",
      "./NotesTab.stories.tsx",
      "./SpellsTab.stories.tsx",
    ]);
  });

  it.each(stories)("%s renders", async (_name, Story) => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => {
      root.render((Story as () => React.ReactNode)());
    });
    // A tab that renders nothing is as broken as one that throws.
    expect(host.textContent?.trim().length).toBeGreaterThan(0);
    await act(async () => root.unmount());
    host.remove();
  });
});
