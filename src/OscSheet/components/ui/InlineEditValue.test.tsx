// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { InlineEditValue } from "@ui/InlineEditValue";

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

function edit(typed: string, key: "Enter" | "Escape") {
  act(() =>
    container.querySelector<HTMLElement>("[aria-label='Edit Uses']")?.click(),
  );
  const field = container.querySelector<HTMLElement>("[role=textbox]")!;
  act(() => {
    field.textContent = typed;
    field.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });
}

describe("InlineEditValue", () => {
  it("commits the parsed value on Enter", () => {
    const committed: number[] = [];
    act(() =>
      root.render(
        <InlineEditValue
          label="Uses"
          value="3"
          parse="int"
          onCommit={(next) => committed.push(next)}
        />,
      ),
    );
    edit("7", "Enter");
    expect(committed).toEqual([7]);
    expect(container.textContent).toBe("3");
  });

  it("discards the edit on Escape", () => {
    const committed: string[] = [];
    act(() =>
      root.render(
        <InlineEditValue
          label="Uses"
          value="3"
          onCommit={(next) => committed.push(next)}
        />,
      ),
    );
    edit("7", "Escape");
    expect(committed).toEqual([]);
    expect(container.textContent).toBe("3");
  });

  it("edits the raw value behind a formatted display", () => {
    act(() =>
      root.render(
        <InlineEditValue
          label="Uses"
          value="+9"
          editValue="9"
          onCommit={() => {}}
        />,
      ),
    );
    act(() =>
      container.querySelector<HTMLElement>("[aria-label='Edit Uses']")?.click(),
    );
    expect(container.querySelector("[role=textbox]")?.textContent).toBe("9");
  });
});
