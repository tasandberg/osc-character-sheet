// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { GuideWindow } from "./GuideWindow";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
Element.prototype.scrollIntoView ??= () => {};

let host: HTMLDivElement;
let root: Root;

const mount = (initial?: string) =>
  act(() => {
    root.render(<GuideWindow initial={initial} />);
  });

const search = () => host.querySelector<HTMLInputElement>('[role="combobox"]')!;

function type(text: string) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setValue.call(search(), text);
    search().dispatchEvent(new Event("input", { bubbles: true }));
  });
}

const press = (key: string) =>
  act(() => {
    search().dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("GuideWindow", () => {
  it("finds a section by a word in its body and announces the count", () => {
    mount();
    type("backpacks");

    const options = [...host.querySelectorAll('[role="option"]')].map((o) => o.textContent);
    expect(options).toEqual([expect.stringContaining("InventoryContainers")]);
    expect(host.querySelector("mark")?.textContent).toBe("Backpacks");
    expect(host.querySelector('[role="status"]')?.textContent).toBe("1 result for backpacks");
  });

  it("opens the highlighted result's section with the keyboard", () => {
    mount();
    type("heavy");
    press("Enter");

    expect(document.activeElement?.textContent).toBe("Encumbrance");
    expect(host.querySelector('[role="listbox"]')?.closest("[hidden]")).not.toBeNull();
  });

  it("lands on the linked section when opened with a deep link", () => {
    mount("inventory#containers");

    expect(host.querySelector("h1")?.textContent).toBe("Inventory");
    expect(document.activeElement?.textContent).toBe("Containers");
  });

  it("follows a guide link to another page's section", () => {
    mount();
    const link = [...host.querySelectorAll("a")].find((a) => a.textContent === "carrying gear")!;
    act(() => link.click());

    expect(document.activeElement?.textContent).toBe("Encumbrance");
  });
});
