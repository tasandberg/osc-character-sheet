// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CreationWizard } from "./CreationWizard";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;

function open() {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() =>
    root.render(<CreationWizard worldName="Hollow Fen" houseRules={[]} />),
  );
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

  it("shows Back only after the first step", () => {
    open();
    expect(button("Back")).toBeUndefined();

    press("Mark done");
    act(() => next().click());
    press("Back");
    expect(currentStep()).toBe("1Scores");
  });

  it("starts fresh when the window is reopened", () => {
    open();
    press("Mark done");
    act(() => next().click());
    close();

    open();
    expect(currentStep()).toBe("1Scores");
    expect(button("1Scores")).toBeUndefined();
  });
});
