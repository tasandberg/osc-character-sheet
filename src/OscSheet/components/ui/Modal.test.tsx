// @vitest-environment jsdom
// A click dispatches on the nearest common ancestor of press and release, so
// selecting text inside a modal and releasing on the scrim used to dismiss it.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Modal } from "./Modal";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
const onClose = vi.fn();

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => {
    root.render(
      <Modal open title="Test" onClose={onClose}>
        <input className="field" />
      </Modal>,
    );
  });
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  onClose.mockReset();
});

const scrim = () => host.querySelector<HTMLElement>(".modal-scrim")!;
const modal = () => host.querySelector<HTMLElement>(".modal")!;
const field = () => host.querySelector<HTMLElement>(".field")!;

// jsdom has no PointerEvent, and does not retarget click to the common ancestor
// on its own — both are simulated the way a browser would deliver them.
const fire = (el: Element, type: string) =>
  act(() => {
    el.dispatchEvent(new MouseEvent(type, { bubbles: true }));
  });

/** press → release → the click the browser dispatches on their common ancestor. */
const drag = (from: Element, to: Element, common: Element) => {
  fire(from, "pointerdown");
  fire(to, "pointerup");
  fire(common, "click");
};

describe("Modal backdrop dismissal", () => {
  it("closes when the press and the release are both on the scrim", () => {
    drag(scrim(), scrim(), scrim());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays open when a drag starts inside and ends on the scrim", () => {
    drag(field(), scrim(), scrim());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("stays open when a drag starts on the scrim and ends inside", () => {
    drag(scrim(), field(), scrim());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("stays open on a plain click inside", () => {
    drag(field(), field(), modal());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("still closes on a genuine scrim click after a drag that did not dismiss", () => {
    drag(field(), scrim(), scrim());
    expect(onClose).not.toHaveBeenCalled();
    drag(scrim(), scrim(), scrim());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes from the close button without a preceding press", () => {
    act(() => host.querySelector<HTMLButtonElement>(".x")!.click());
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
