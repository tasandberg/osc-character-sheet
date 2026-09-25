// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { InlineButton } from "@ui/InlineButton";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

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

const buttonNamed = (name: string) =>
  Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent === name,
  )!;

describe("InlineButton link", () => {
  it("fires its action from anywhere in mixed content", () => {
    const onClick = vi.fn();
    act(() =>
      root.render(
        <InlineButton variant="link" size="2xs" onClick={onClick}>
          <i className="fa-solid fa-plus" />
          Add <strong>two</strong> spells
        </InlineButton>,
      ),
    );
    const button = buttonNamed("Add two spells");
    act(() => button.querySelector("strong")!.click());
    act(() => button.click());
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("is disabled and inert when disabled", () => {
    const onClick = vi.fn();
    act(() =>
      root.render(
        <InlineButton variant="link" disabled onClick={onClick}>
          Memorize
        </InlineButton>,
      ),
    );
    const button = buttonNamed("Memorize");
    expect(button.disabled).toBe(true);
    act(() => button.click());
    expect(onClick).not.toHaveBeenCalled();
  });
});
