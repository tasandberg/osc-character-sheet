// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SheetErrorBoundary } from "./ErrorBoundary";
import { hasDsn, sendCrashReport } from "@src/telemetry/crashReporter";
import type { OSEActor } from "@domain/types";

// Real buildCrashReport/formatCrashReport (so the disclosure/scrub path is
// exercised for real); only the DSN gate and the network sender are mocked.
vi.mock("@src/telemetry/crashReporter", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@src/telemetry/crashReporter")>()),
  hasDsn: vi.fn(() => true),
  sendCrashReport: vi.fn(async () => true),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;
let shouldThrow = true;
let bombMessage = "kaboom in render";

function Bomb() {
  if (shouldThrow) throw new Error(bombMessage);
  return <div data-alive="1">sheet content</div>;
}

function renderBoundary(actor?: OSEActor) {
  act(() =>
    root.render(
      <SheetErrorBoundary actor={actor}>
        <Bomb />
      </SheetErrorBoundary>,
    ),
  );
}

function findButton(label: string) {
  return [...container.querySelectorAll("button")].find(
    (b) => b.textContent === label,
  );
}

function clickButton(label: string) {
  const btn = findButton(label);
  expect(btn, `button "${label}"`).toBeTruthy();
  act(() => btn!.click());
}

beforeEach(() => {
  shouldThrow = true;
  bombMessage = "kaboom in render";
  vi.mocked(hasDsn).mockReturnValue(true);
  vi.mocked(sendCrashReport).mockResolvedValue(true);
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
  it("renders the fallback when a child throws — and sends nothing", () => {
    renderBoundary();
    expect(container.textContent).toContain("Well, this is embarrassing");
    expect(container.textContent).toContain("kaboom in render");
    expect(sendCrashReport).not.toHaveBeenCalled();
  });

  it("'Reopen sheet' remounts the children", () => {
    renderBoundary();
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
    renderBoundary(actor);
    clickButton("Use default sheet");
    await act(async () => {});
    expect(setFlag).toHaveBeenCalledWith(
      "core",
      "sheetClass",
      "ose.OseActorSheetCharacter",
    );
    delete (globalThis as { CONFIG?: unknown }).CONFIG;
  });

  it("'Send bug report' sends the built report only on click", async () => {
    renderBoundary();
    expect(sendCrashReport).not.toHaveBeenCalled();
    clickButton("Send bug report");
    await act(async () => {});
    expect(sendCrashReport).toHaveBeenCalledOnce();
    const report = vi.mocked(sendCrashReport).mock.calls[0][0];
    expect(report.errorMessage).toBe("kaboom in render");
    expect(report.stack).toBeTruthy();
    expect(findButton("Report sent ✓")).toBeTruthy();
    expect(findButton("Report sent ✓")!.disabled).toBe(true);
  });

  it("a failed send offers a retry", async () => {
    vi.mocked(sendCrashReport).mockResolvedValue(false);
    renderBoundary();
    clickButton("Send bug report");
    await act(async () => {});
    expect(container.textContent).toContain("Couldn't send the report");
    vi.mocked(sendCrashReport).mockResolvedValue(true);
    clickButton("Retry send");
    await act(async () => {});
    expect(sendCrashReport).toHaveBeenCalledTimes(2);
    expect(findButton("Report sent ✓")).toBeTruthy();
  });

  it("without a DSN: no send button, copy fallback + issues link instead", () => {
    vi.mocked(hasDsn).mockReturnValue(false);
    renderBoundary();
    expect(findButton("Send bug report")).toBeUndefined();
    expect(findButton("Copy error details")).toBeTruthy();
    const link = [...container.querySelectorAll("a")].find((a) =>
      a.href.includes("/issues"),
    );
    expect(link).toBeTruthy();
  });

  it("the 'see what's included' disclosure shows the scrubbed payload", () => {
    (globalThis as { game?: unknown }).game = {
      users: [{ name: "Tim the GM" }],
      actors: [{ name: "Grimble Toadfoot" }],
      modules: { get: () => ({ version: "1.2.3" }) },
      version: "14.359",
      system: { version: "2.0.0" },
    };
    bombMessage = "Grimble Toadfoot (Actor.a1B2c3D4e5F6g7H8) exploded";
    renderBoundary();
    const pre = container.querySelector("details pre");
    expect(pre).toBeTruthy();
    const payload = pre!.textContent!;
    expect(payload).not.toContain("Grimble Toadfoot");
    expect(payload).not.toContain("a1B2c3D4e5F6g7H8");
    expect(payload).toContain("[redacted]");
    expect(payload).toContain('"moduleVersion": "1.2.3"');
    expect(payload).toContain('"foundryVersion": "14.359"');
    expect(payload).toContain('"oseVersion": "2.0.0"');
    delete (globalThis as { game?: unknown }).game;
  });
});
