// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useDismiss } from "@ui/useDismiss";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function Menu({
  onClose,
  active,
  closeOnBlur,
}: {
  onClose: () => void;
  active?: boolean;
  closeOnBlur?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, onClose, { active, closeOnBlur });
  return (
    <div ref={ref}>
      <button type="button">inside</button>
    </div>
  );
}

const pointerDown = (target: EventTarget) =>
  target.dispatchEvent(new Event("pointerdown", { bubbles: true }));
const escape = (win: Window) =>
  win.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

let iframe: HTMLIFrameElement;
let host: HTMLDivElement;
let root: Root;

const mount = (doc: Document, node: React.ReactNode) => {
  host = doc.createElement("div");
  doc.body.append(host);
  root = createRoot(host);
  act(() => root.render(node));
};

beforeEach(() => {
  iframe = document.createElement("iframe");
  document.body.append(iframe);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  iframe.remove();
});

describe("useDismiss", () => {
  it("closes on outside pointerdown and Escape, not inside", () => {
    const onClose = vi.fn();
    mount(document, <Menu onClose={onClose} />);
    pointerDown(host.querySelector("button")!);
    expect(onClose).not.toHaveBeenCalled();
    pointerDown(document.body);
    escape(window);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("binds to the window that owns the element", () => {
    const popout = iframe.contentWindow!;
    const onClose = vi.fn();
    mount(popout.document, <Menu onClose={onClose} closeOnBlur />);
    pointerDown(document.body);
    escape(window);
    window.dispatchEvent(new Event("blur"));
    expect(onClose).not.toHaveBeenCalled();
    pointerDown(popout.document.body);
    escape(popout);
    popout.dispatchEvent(new Event("blur"));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("ignores blur unless asked", () => {
    const onClose = vi.fn();
    mount(document, <Menu onClose={onClose} />);
    window.dispatchEvent(new Event("blur"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("binds nothing while inactive", () => {
    const onClose = vi.fn();
    mount(document, <Menu onClose={onClose} active={false} />);
    pointerDown(document.body);
    escape(window);
    expect(onClose).not.toHaveBeenCalled();
  });
});
