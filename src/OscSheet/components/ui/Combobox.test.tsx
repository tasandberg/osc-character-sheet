// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Combobox, type ComboOption, type ComboboxProps } from "./Combobox";
import { filterOptions, shouldShowCreate } from "./comboboxFilter";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const OPTIONS: ComboOption[] = [
  { value: "assassin", label: "Assassin" },
  { value: "cleric", label: "Cleric" },
  { value: "fighter", label: "Fighter" },
  { value: "magic-user", label: "Magic User" },
];

describe("filterOptions", () => {
  it("returns all options for an empty query", () => {
    expect(filterOptions(OPTIONS, "  ")).toHaveLength(OPTIONS.length);
  });
  it("narrows case-insensitively by label substring", () => {
    expect(filterOptions(OPTIONS, "as").map((o) => o.value)).toEqual(["assassin"]);
    expect(filterOptions(OPTIONS, "GHT").map((o) => o.value)).toEqual(["fighter"]);
  });
});

describe("shouldShowCreate", () => {
  it("hides on empty query, exact label match, or when disallowed", () => {
    expect(shouldShowCreate(OPTIONS, "", true)).toBe(false);
    expect(shouldShowCreate(OPTIONS, "fighter", true)).toBe(false); // exact (ci) match
    expect(shouldShowCreate(OPTIONS, "Warlock", false)).toBe(false);
  });
  it("shows for a novel non-empty label", () => {
    expect(shouldShowCreate(OPTIONS, "Warlock", true)).toBe(true);
  });
});

// ── Interactive (jsdom) ───────────────────────────────────────────────
let container: HTMLDivElement;
let root: Root;
const onCommit = vi.fn();

function Harness(props: Partial<ComboboxProps>) {
  const [v, setV] = useState(props.value ?? "");
  return (
    <Combobox
      {...props}
      value={v}
      options={props.options ?? OPTIONS}
      onCommit={(next) => { onCommit(next); setV(next); }}
    />
  );
}

const render = (props: Partial<ComboboxProps> = {}) =>
  act(() => root.render(<Harness {...props} />));

const input = () => container.querySelector("input") as HTMLInputElement;
const rows = () => Array.from(container.querySelectorAll('[role="option"]')) as HTMLElement[];
const optionRows = () => rows().filter((r) => !r.className.includes("combobox-create"));

function setValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}
const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

beforeEach(() => {
  onCommit.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("Combobox", () => {
  it("filters options as the query narrows", () => {
    render();
    act(() => input().focus());
    expect(rows()).toHaveLength(OPTIONS.length);
    act(() => setValue(input(), "fig"));
    expect(optionRows().map((r) => r.textContent)).toEqual(["Fighter"]);
  });

  it("commits the option's value (not its label) on click", () => {
    render();
    act(() => input().focus());
    act(() => setValue(input(), "magic"));
    act(() => rows()[0].click());
    expect(onCommit).toHaveBeenCalledExactlyOnceWith("magic-user");
  });

  it("commits the trimmed typed text via the Create row", () => {
    render();
    act(() => input().focus());
    act(() => setValue(input(), "  Warlock  "));
    const create = rows().find((r) => r.className.includes("combobox-create"))!;
    expect(create.textContent).toContain("Warlock");
    act(() => create.click());
    expect(onCommit).toHaveBeenCalledExactlyOnceWith("Warlock");
  });

  it("commits the highlighted option with ArrowDown + Enter", () => {
    render();
    act(() => input().focus());
    act(() => key(input(), "ArrowDown")); // highlight moves 0 → 1 (Cleric)
    act(() => key(input(), "Enter"));
    expect(onCommit).toHaveBeenCalledExactlyOnceWith("cleric");
  });

  it("reverts to the committed value on Escape without committing", () => {
    render({ value: "fighter" });
    act(() => input().focus());
    act(() => setValue(input(), "zzz"));
    act(() => key(input(), "Escape"));
    expect(onCommit).not.toHaveBeenCalled();
    expect(input().value).toBe("Fighter");
  });

  it("reverts on blur without committing typed text", () => {
    render({ value: "cleric" });
    act(() => input().focus());
    act(() => setValue(input(), "Warl"));
    act(() => input().blur());
    expect(onCommit).not.toHaveBeenCalled();
    expect(input().value).toBe("Cleric");
  });

  it("hides the Create row when allowCreate is false", () => {
    render({ allowCreate: false });
    act(() => input().focus());
    act(() => setValue(input(), "Warlock"));
    expect(rows()).toHaveLength(0);
    expect(rows().some((r) => r.className.includes("combobox-create"))).toBe(false);
  });

  it("renders a custom create-row label via newOptionLabel", () => {
    render({ newOptionLabel: (q) => `Custom: ${q}` });
    act(() => input().focus());
    act(() => setValue(input(), "Warlock"));
    const create = rows().find((r) => r.className.includes("combobox-create"))!;
    expect(create.textContent).toContain("Custom: Warlock");
    act(() => create.click());
    expect(onCommit).toHaveBeenCalledExactlyOnceWith("Warlock");
  });

  it("renders a per-option node while filtering by label", () => {
    const opts: ComboOption[] = OPTIONS.map((o) => ({ ...o, node: <span data-test={o.value}>{o.label} ·</span> }));
    render({ options: opts });
    act(() => input().focus());
    act(() => setValue(input(), "fig"));
    expect(optionRows()).toHaveLength(1);
    expect(optionRows()[0].querySelector("[data-test=fighter]")).not.toBeNull();
  });

  it("highlights the current value when opened", () => {
    render({ value: "fighter" });
    act(() => input().focus());
    const highlighted = rows().find((r) => r.className.includes("is-highlighted"));
    expect(highlighted?.textContent).toBe("Fighter");
  });

  it("closes on re-click when untouched, keeping the value", () => {
    render({ value: "fighter" });
    act(() => input().focus()); // first focus opens
    expect(container.querySelector(".combobox-pop")).not.toBeNull();
    act(() => input().dispatchEvent(new MouseEvent("mousedown", { bubbles: true })));
    expect(container.querySelector(".combobox-pop")).toBeNull();
    expect(onCommit).not.toHaveBeenCalled();
    expect(input().value).toBe("Fighter");
  });

  it("blurs the input after a commit", () => {
    render();
    act(() => input().focus());
    expect(document.activeElement).toBe(input());
    act(() => setValue(input(), "magic"));
    act(() => rows()[0].click());
    expect(document.activeElement).not.toBe(input());
  });
});
