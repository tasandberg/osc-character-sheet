// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CreationWizard } from "./CreationWizard";
import { memoryDraftStore, type DraftStore } from "./draftStore";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;

function open(store: DraftStore = memoryDraftStore(), onCancel = vi.fn()) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() =>
    root.render(
      <CreationWizard
        worldName="Hollow Fen"
        houseRules={[]}
        store={store}
        onCancel={onCancel}
      />,
    ),
  );
  return { store, onCancel };
}

function close() {
  act(() => root.unmount());
  host.remove();
}

afterEach(close);

const button = (name: string) =>
  [...host.querySelectorAll("button")].find(
    (b) => b.textContent?.trim() === name,
  );
const press = (name: string) => act(() => button(name)!.click());
const currentStep = () =>
  host.querySelector('[aria-current="step"]')?.textContent;
const next = () =>
  [...host.querySelectorAll("button")].find((b) =>
    b.textContent?.startsWith("Next"),
  )!;

describe("CreationWizard", () => {
  it("holds Next until the current step is complete, then advances", () => {
    open();
    expect(currentStep()).toBe("1Scores");
    expect(next().getAttribute("aria-disabled")).toBe("true");
    expect(host.textContent).toContain("Mark Scores done to continue");

    act(() => next().click());
    expect(currentStep()).toBe("1Scores");

    press("Mark done");
    expect(next().getAttribute("aria-disabled")).toBe("false");
    act(() => next().click());
    expect(currentStep()).toBe("2Class");
  });

  it("links back to done steps but not to unfinished ones", () => {
    open();
    press("Mark done");
    act(() => next().click());

    expect(button("3Details")).toBeUndefined();
    press("1Scores");
    expect(currentStep()).toBe("1Scores");
  });

  it("offers Cancel on the first step and Back afterwards", () => {
    const { onCancel } = open();
    press("Cancel");
    expect(onCancel).toHaveBeenCalled();

    press("Mark done");
    act(() => next().click());
    press("Back");
    expect(currentStep()).toBe("1Scores");
  });

  it("resumes the saved step and draft when reopened", () => {
    const { store } = open();
    press("Mark done");
    act(() => next().click());
    close();

    open(store);
    expect(currentStep()).toBe("2Class");
    expect(button("1Scores")).toBeDefined();
  });

  it("starts fresh at the first step when the saved draft is unreadable", () => {
    open(memoryDraftStore({ step: "review", draft: "not a draft" }));
    expect(currentStep()).toBe("1Scores");
  });
});
