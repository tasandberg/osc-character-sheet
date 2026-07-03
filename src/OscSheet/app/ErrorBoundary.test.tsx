// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SheetErrorBoundary } from "./ErrorBoundary";
import { reportError } from "@src/telemetry/crashReporter";
import type { OSEActor } from "@domain/types";

vi.mock("@src/telemetry/crashReporter", () => ({ reportError: vi.fn() }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;
let shouldThrow = true;

function Bomb() {
  if (shouldThrow) throw new Error("kaboom in render");
  return <div data-alive="1">sheet content</div>;
}

function clickButton(label: string) {
  const btn = [...container.querySelectorAll("button")].find(
    (b) => b.textContent === label,
  );
  expect(btn, `button "${label}"`).toBeTruthy();
  act(() => btn!.click());
}

beforeEach(() => {
  shouldThrow = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  // React logs caught boundary errors — keep test output clean
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("SheetErrorBoundary", () => {
  it("renders the fallback when a child throws and reports the error", () => {
    act(() =>
      root.render(
        <SheetErrorBoundary>
          <Bomb />
        </SheetErrorBoundary>,
      ),
    );
    expect(container.textContent).toContain("Well, this is embarrassing");
    expect(container.textContent).toContain("kaboom in render");
    expect(container.querySelector("details pre")).toBeTruthy();
    expect(reportError).toHaveBeenCalledOnce();
    expect(vi.mocked(reportError).mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it("'Reopen sheet' remounts the children", () => {
    act(() =>
      root.render(
        <SheetErrorBoundary>
          <Bomb />
        </SheetErrorBoundary>,
      ),
    );
    shouldThrow = false;
    clickButton("Reopen sheet");
    expect(container.textContent).toContain("sheet content");
    expect(container.textContent).not.toContain("embarrassing");
  });

  it("'Use default sheet' unpins our sheet class on the actor", async () => {
    (globalThis as { CONFIG?: unknown }).CONFIG = {
      Actor: {
        sheetClasses: {
          character: { "ose.OscSheet": {}, "ose.OseActorSheetCharacter": {} },
        },
      },
    };
    const setFlag = vi.fn().mockResolvedValue(undefined);
    const actor = { type: "character", setFlag, system: {} } as unknown as OSEActor;
    act(() =>
      root.render(
        <SheetErrorBoundary actor={actor}>
          <Bomb />
        </SheetErrorBoundary>,
      ),
    );
    clickButton("Use default sheet");
    await act(async () => {});
    expect(setFlag).toHaveBeenCalledWith(
      "core",
      "sheetClass",
      "ose.OseActorSheetCharacter",
    );
    delete (globalThis as { CONFIG?: unknown }).CONFIG;
  });
});
