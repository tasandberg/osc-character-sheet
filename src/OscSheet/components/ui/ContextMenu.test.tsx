// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ContextMenu } from "@ui/ContextMenu";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const key = (target: Element | null | undefined, name: string) =>
  act(() =>
    target?.dispatchEvent(
      new KeyboardEvent("keydown", { key: name, bubbles: true }),
    ),
  );

const item = (label: string) =>
  [...container.querySelectorAll("[role^=menuitem]")].find((el) =>
    el.textContent?.startsWith(label),
  );

describe("ContextMenu", () => {
  it("opens a submenu and selects from it", () => {
    let picked = "";
    act(() =>
      root.render(
        <ContextMenu
          anchor={{ x: 0, y: 0 }}
          title="Bite"
          entries={[
            {
              label: "Attack group",
              entries: [
                {
                  label: "Red",
                  checked: false,
                  onSelect: () => (picked = "Red"),
                },
              ],
            },
          ]}
          onClose={() => {}}
        />,
      ),
    );
    expect(item("Red")).toBeUndefined();
    key(item("Attack group"), "ArrowRight");
    expect(
      container.querySelector("[role=menu][aria-label='Attack group']"),
    ).not.toBeNull();
    key(item("Red"), "Enter");
    expect(picked).toBe("Red");
  });

  it("closes on Escape", () => {
    let closed = false;
    act(() =>
      root.render(
        <ContextMenu
          anchor={{ x: 0, y: 0 }}
          entries={[{ label: "Edit" }]}
          onClose={() => (closed = true)}
        />,
      ),
    );
    key(item("Edit"), "Escape");
    expect(closed).toBe(true);
  });
});
