import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, vi } from "vitest";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

export const READY = {
  portraitUploads: true,
  portraitUploadPath: "worlds/w/osc",
};
export const OFF = { portraitUploads: false, portraitUploadPath: "" };

export const png = new File(["x"], "hero.png", { type: "image/png" });
export const notes = new File(["x"], "notes.txt", { type: "text/plain" });
export const tile = (src: string) =>
  JSON.stringify({ type: "Tile", texture: { src }, fromFilePicker: true });

export const notify = { error: vi.fn(), warn: vi.fn() };

export function setWorld(
  settings: Record<string, unknown> = READY,
  { isGM = false, canUpload = true } = {},
) {
  const store = new Map(Object.entries(settings));
  vi.stubGlobal("game", {
    settings: {
      get: (_ns: string, key: string) => store.get(key),
      set: vi.fn(),
    },
    user: { isGM, can: (perm: string) => canUpload && perm === "FILES_UPLOAD" },
  });
  vi.stubGlobal("ui", { notifications: notify });
}

export type Transfer = { files?: File[]; data?: Record<string, string> };

export function fireDrag(
  el: EventTarget,
  type: string,
  { files = [], data = {} }: Transfer = {},
) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", {
    value: {
      files,
      types: [...(files.length ? ["Files"] : []), ...Object.keys(data)],
      items: files.map((f) => ({ kind: "file", type: f.type })),
      getData: (t: string) => data[t] ?? "",
      dropEffect: "",
    },
  });
  act(() => {
    el.dispatchEvent(event);
  });
  return event;
}

export function mountEach() {
  let root: Root;
  const dom = {
    container: document.createElement("div"),
    render: (node: ReactNode) => act(() => root.render(node)),
    get: (selector: string) =>
      dom.container.querySelector<HTMLElement>(selector),
    all: (selector: string) => [
      ...dom.container.querySelectorAll<HTMLElement>(selector),
    ],
    zone: (target: string) =>
      dom.get(`[data-testid="image-drop-zone"][data-target="${target}"]`)!,
    zoneLabels: () =>
      dom.all('[data-testid="image-drop-zone"]').map((el) => el.textContent),
    status: () => dom.get('[role="status"]')?.textContent ?? null,
  };
  beforeEach(() => {
    dom.container = document.body.appendChild(document.createElement("div"));
    root = createRoot(dom.container);
    notify.error.mockClear();
    notify.warn.mockClear();
    setWorld();
  });
  afterEach(() => {
    act(() => root.unmount());
    dom.container.remove();
    vi.unstubAllGlobals();
  });
  return dom;
}
