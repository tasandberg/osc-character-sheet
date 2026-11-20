// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import CreationWizardApp from "./index";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;

afterEach(() => {
  act(() => root.unmount());
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("CreationWizardApp", () => {
  it("tells the user when the classes and races can't be loaded", async () => {
    vi.stubGlobal("game", {
      system: { id: "ose" },
      world: { title: "Test World" },
      items: {
        filter: () => {
          throw new Error("unreadable");
        },
      },
      packs: { contents: [] },
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const host = document.body.appendChild(document.createElement("div"));
    root = createRoot(host);
    await act(async () => root.render(<CreationWizardApp />));

    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      "Couldn’t load the classes and races",
    );
  });
});
