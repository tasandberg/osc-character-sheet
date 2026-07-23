// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Combobox, type ComboOption, type ComboboxProps } from "./Combobox";
import { filterOptions, shouldShowCreate } from "./comboboxFilter";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

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
    expect(filterOptions(OPTIONS, "as").map((o) => o.value)).toEqual([
      "assassin",
    ]);
    expect(filterOptions(OPTIONS, "GHT").map((o) => o.value)).toEqual([
      "fighter",
    ]);
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
      onCommit={(next) => {
        onCommit(next);
        setV(next);
      }}
    />
  );
}

const render = (props: Partial<ComboboxProps> = {}) =>
  act(() => root.render(<Harness {...props} />));

const input = () => container.querySelector("input") as HTMLInputElement;
const rows = () =>
  Array.from(document.querySelectorAll('[role="option"]')) as HTMLElement[];
const optionRows = () =>
  rows().filter((r) => !r.className.includes("combobox-create"));

function setValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )!.set!;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}
const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(
    new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }),
  );
const pointerDown = (el: HTMLElement, button = 0) =>
  el.dispatchEvent(
    new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button }),
  );

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

  it("commits the option's value (not its label) on pointerdown", () => {
    render();
    act(() => input().focus());
    act(() => setValue(input(), "magic"));
    act(() => pointerDown(optionRows()[0]));
    expect(onCommit).toHaveBeenCalledExactlyOnceWith("magic-user");
  });

  it("ignores non-primary pointer buttons on an option", () => {
    render();
    act(() => input().focus());
    act(() => setValue(input(), "magic"));
    act(() => pointerDown(optionRows()[0], 2));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commits the trimmed typed text via the Create row", () => {
    render();
    act(() => input().focus());
    act(() => setValue(input(), "  Warlock  "));
    const create = rows().find((r) => r.className.includes("combobox-create"))!;
    expect(create.textContent).toContain("Warlock");
    act(() => pointerDown(create));
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
    expect(rows().some((r) => r.className.includes("combobox-create"))).toBe(
      false,
    );
  });

  it("renders a custom create-row label via newOptionLabel", () => {
    render({ newOptionLabel: (q) => `Custom: ${q}` });
    act(() => input().focus());
    act(() => setValue(input(), "Warlock"));
    const create = rows().find((r) => r.className.includes("combobox-create"))!;
    expect(create.textContent).toContain("Custom: Warlock");
    act(() => pointerDown(create));
    expect(onCommit).toHaveBeenCalledExactlyOnceWith("Warlock");
  });

  it("renders a per-option node while filtering by label", () => {
    const opts: ComboOption[] = OPTIONS.map((o) => ({
      ...o,
      node: <span data-test={o.value}>{o.label} ·</span>,
    }));
    render({ options: opts });
    act(() => input().focus());
    act(() => setValue(input(), "fig"));
    expect(optionRows()).toHaveLength(1);
    expect(optionRows()[0].querySelector("[data-test=fighter]")).not.toBeNull();
  });

  it("highlights the current value when opened", () => {
    render({ value: "fighter" });
    act(() => input().focus());
    const highlighted = rows().find((r) =>
      r.className.includes("is-highlighted"),
    );
    expect(highlighted?.textContent).toBe("Fighter");
  });

  it("closes on re-click when untouched, keeping the value", () => {
    render({ value: "fighter" });
    act(() => input().focus()); // first focus opens
    expect(document.querySelector(".combobox-pop")).not.toBeNull();
    act(() =>
      input().dispatchEvent(new MouseEvent("mousedown", { bubbles: true })),
    );
    expect(document.querySelector(".combobox-pop")).toBeNull();
    expect(onCommit).not.toHaveBeenCalled();
    expect(input().value).toBe("Fighter");
  });

  it("renders the value as a chip at rest, hidden text, when renderValue is given", () => {
    render({
      value: "fighter",
      renderValue: (v) => <span data-test="chip">{v}!</span>,
    });
    const chip = container.querySelector(".combobox-chip");
    expect(chip).not.toBeNull();
    expect(chip?.querySelector("[data-test=chip]")?.textContent).toBe(
      "fighter!",
    );
    expect(input().classList.contains("is-chip")).toBe(true);
  });

  it("reveals the raw input value on focus, replacing the chip", () => {
    render({
      value: "fighter",
      renderValue: (v) => <span data-test="chip">{v}!</span>,
    });
    expect(container.querySelector(".combobox-chip")).not.toBeNull();
    act(() => input().focus());
    // Focus swaps the chip for the editable value so it can be selected/typed over.
    expect(container.querySelector(".combobox-chip")).toBeNull();
    expect(input().classList.contains("is-chip")).toBe(false);
    expect(input().value).toBe("Fighter");
    act(() => setValue(input(), "War"));
    expect(input().value).toBe("War");
  });

  it("shows no chip for an empty value, falling back to placeholder", () => {
    render({ value: "", renderValue: (v) => <span>{v}</span> });
    expect(container.querySelector(".combobox-chip")).toBeNull();
    expect(input().classList.contains("is-chip")).toBe(false);
  });

  it("renders plain input text when renderValue is omitted", () => {
    render({ value: "fighter" });
    expect(container.querySelector(".combobox-chip")).toBeNull();
    expect(input().classList.contains("is-chip")).toBe(false);
    expect(input().value).toBe("Fighter");
  });

  it("blurs the input after a commit", () => {
    render();
    act(() => input().focus());
    expect(document.activeElement).toBe(input());
    act(() => setValue(input(), "magic"));
    act(() => pointerDown(rows()[0]));
    expect(document.activeElement).not.toBe(input());
  });
});
