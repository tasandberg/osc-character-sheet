// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SheetImageDrop } from "@features/portraitDrop/SheetImageDrop";
import {
  portraitDropIndicator,
  usePortraitDrop,
} from "@features/portraitDrop/usePortraitDrop";
import type { ImageDrop } from "@features/portraitDrop/parseImageDrop";
import { Portrait } from "@layout/Portrait";
import { Minibar } from "@layout/Minibar";
import type { IdentityVM, VitalsVM } from "@domain/vm-types";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const tile = (src: string) =>
  JSON.stringify({ type: "Tile", texture: { src }, fromFilePicker: true });

let container: HTMLDivElement;
let root: Root;
const onImage = vi.fn<(drop: ImageDrop) => void>();
const warn = vi.fn();

const identity = {
  name: "Ana",
  img: "ana.png",
  classLabel: "Fighter",
  level: 1,
} as unknown as IdentityVM;
const vitals = {
  hp: { value: 5, max: 8 },
  ac: { value: 7, ascending: false },
} as unknown as VitalsVM;

function Harness({ enabled = true }: { enabled?: boolean }) {
  const zone = usePortraitDrop({ enabled, onImage });
  const indicator = portraitDropIndicator(zone);
  return (
    <SheetImageDrop zone={zone}>
      <Minibar identity={identity} vitals={vitals} dropIndicator={indicator} />
      <Portrait identity={identity} dropIndicator={indicator} />
      <div className="osc-inv-row" draggable />
    </SheetImageDrop>
  );
}

function setWorld(
  settings: Record<string, unknown>,
  user = { isGM: false, upload: true },
) {
  const store = new Map(
    Object.entries(settings).map(([k, v]) => [`osc-character-sheet.${k}`, v]),
  );
  (globalThis as { game?: unknown }).game = {
    settings: {
      get: (ns: string, key: string) => store.get(`${ns}.${key}`),
      set: vi.fn(),
    },
    user: {
      isGM: user.isGM,
      can: (perm: string) => perm === "FILES_UPLOAD" && user.upload,
    },
  };
  (globalThis as { ui?: unknown }).ui = { notifications: { warn } };
}

const READY = {
  portraitUploads: true,
  portraitUploadPath: "worlds/w/osc-portraits",
};

type Transfer = { files?: File[]; data?: Record<string, string> };

function fire(
  el: EventTarget,
  type: string,
  { files = [], data = {} }: Transfer = {},
) {
  const e = new Event(type, { bubbles: true, cancelable: true });
  const dataTransfer = {
    files,
    types: [...(files.length ? ["Files"] : []), ...Object.keys(data)],
    getData: (t: string) => data[t] ?? "",
    setData: () => {},
    dropEffect: "",
  };
  Object.defineProperty(e, "dataTransfer", { value: dataTransfer });
  act(() => {
    el.dispatchEvent(e);
  });
  return { event: e, dataTransfer };
}

const sheet = () =>
  container.querySelector<HTMLElement>('[data-testid="sheet-image-drop"]')!;
const row = () => container.querySelector<HTMLElement>(".osc-inv-row")!;
const overlay = () =>
  container.querySelector(
    '.osc-portrait-wrap [data-testid="portrait-drop-indicator"]',
  );
const minibarIndicator = () =>
  container.querySelector(
    '.osc-mb-portrait-wrap [data-testid="minibar-portrait-drop-indicator"]',
  );
const anyIndicator = () =>
  container.querySelector('[data-testid$="portrait-drop-indicator"]');
const png = () => new File(["x"], "hero.png", { type: "image/png" });

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  onImage.mockClear();
  warn.mockClear();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete (globalThis as { game?: unknown }).game;
  delete (globalThis as { ui?: unknown }).ui;
});

const render = (enabled = true) =>
  act(() => root.render(<Harness enabled={enabled} />));

describe("sheet image drop zone", () => {
  it("shows no overlay and no drop state until something is dragged over", () => {
    setWorld(READY);
    render();
    expect(overlay()).toBeNull();
    expect(sheet().hasAttribute("data-drop")).toBe(false);
  });

  it("invites a file drop and hands the file over when uploads are ready", () => {
    setWorld(READY);
    render();
    const file = png();
    fire(sheet(), "dragenter", { files: [file] });
    expect(overlay()?.textContent).toBe("Drop image");
    expect(sheet().getAttribute("data-drop")).toBe("ready");
    const { event, dataTransfer } = fire(sheet(), "dragover", {
      files: [file],
    });
    expect(event.defaultPrevented).toBe(true);
    expect(dataTransfer.dropEffect).toBe("copy");
    fire(sheet(), "drop", { files: [file] });
    expect(onImage).toHaveBeenCalledWith({ kind: "file", file });
    expect(overlay()).toBeNull();
    expect(sheet().hasAttribute("data-drop")).toBe(false);
  });

  it("marks the sheet and shows Drop image on both portraits for a drag over other content", () => {
    setWorld(READY);
    render();
    fire(row(), "dragenter", { files: [png()] });
    expect(sheet().getAttribute("data-drop")).toBe("ready");
    expect(overlay()?.textContent).toBe("Drop image");
    expect(minibarIndicator()).not.toBeNull();
  });

  it("marks the sheet blocked and shows the gate message on the portrait", () => {
    setWorld({
      portraitUploads: false,
      portraitUploadPath: "worlds/w/osc-portraits",
    });
    render();
    fire(row(), "dragenter", { files: [png()] });
    expect(sheet().getAttribute("data-drop")).toBe("blocked");
    expect(overlay()?.querySelector('[role="status"]')?.textContent).toBe(
      "Portrait uploads not enabled for this world",
    );
    expect(
      minibarIndicator()?.querySelector('[role="status"]')?.textContent,
    ).toBe("Portrait uploads not enabled for this world");
  });

  it("accepts a drop anywhere inside the sheet", () => {
    setWorld(READY);
    render();
    const file = png();
    fire(row(), "dragenter", { files: [file] });
    expect(sheet().getAttribute("data-drop")).toBe("ready");
    fire(row(), "drop", { files: [file] });
    expect(onImage).toHaveBeenCalledWith({ kind: "file", file });
  });

  it("clears the overlay when the drag leaves", () => {
    setWorld(READY);
    render();
    fire(sheet(), "dragenter", { files: [png()] });
    fire(sheet(), "dragleave", { files: [png()] });
    expect(overlay()).toBeNull();
    expect(sheet().hasAttribute("data-drop")).toBe(false);
  });

  it("keeps the overlay while the drag moves between children", () => {
    setWorld(READY);
    render();
    fire(sheet(), "dragenter", { files: [png()] });
    fire(row(), "dragenter", { files: [png()] });
    fire(sheet(), "dragleave", { files: [png()] });
    expect(sheet().getAttribute("data-drop")).toBe("ready");
  });

  it("shows the gate message and refuses a file drop when uploads are off", () => {
    setWorld({
      portraitUploads: false,
      portraitUploadPath: "worlds/w/osc-portraits",
    });
    render();
    const file = png();
    fire(sheet(), "dragenter", { files: [file] });
    expect(
      container.querySelector(
        '.osc-portrait-wrap [data-testid="portrait-drop-indicator"] [role="status"]',
      )?.textContent,
    ).toBe("Portrait uploads not enabled for this world");
    expect(sheet().getAttribute("data-drop")).toBe("blocked");
    const { dataTransfer } = fire(sheet(), "dragover", { files: [file] });
    expect(dataTransfer.dropEffect).toBe("none");
    fire(sheet(), "drop", { files: [file] });
    expect(onImage).not.toHaveBeenCalled();
  });

  it("tells a player without upload permission to ask their GM", () => {
    setWorld(READY, { isGM: false, upload: false });
    render();
    fire(sheet(), "dragenter", { files: [png()] });
    expect(overlay()?.textContent).toBe(
      "Ask your GM to set an upload target for OSC Sheet portraits",
    );
  });

  it("accepts a path drag even when uploads are off", () => {
    setWorld({ portraitUploads: false, portraitUploadPath: "" });
    render();
    const data = { "text/uri-list": "https://example.com/hero.webp" };
    fire(sheet(), "dragenter", { data });
    expect(overlay()?.textContent).toBe("Drop image");
    fire(sheet(), "dragover", { data });
    fire(sheet(), "drop", { data });
    expect(onImage).toHaveBeenCalledWith({
      kind: "path",
      src: "https://example.com/hero.webp",
    });
  });

  it("accepts a FilePicker tile drag via the cached dragstart payload", () => {
    setWorld({ portraitUploads: false, portraitUploadPath: "" });
    render();
    const data = { "text/plain": tile("worlds/w/art/hero.png") };
    fire(document.body, "dragstart", { data });
    fire(sheet(), "dragenter", { data: { "text/plain": "" } });
    expect(overlay()?.textContent).toBe("Drop image");
    fire(sheet(), "drop", { data });
    expect(onImage).toHaveBeenCalledWith({
      kind: "path",
      src: "worlds/w/art/hero.png",
    });
  });

  it.each([
    ["an inventory reorder", "root:0"],
    [
      "a Foundry Item",
      JSON.stringify({ type: "Item", uuid: "Actor.a.Item.b" }),
    ],
  ])("stays out of the way of %s drag", (_, payload) => {
    setWorld(READY);
    render();
    const ancestor = { dragover: vi.fn(), drop: vi.fn() };
    document.body.addEventListener("dragover", ancestor.dragover);
    document.body.addEventListener("drop", ancestor.drop);
    const data = { "text/plain": payload };
    fire(row(), "dragstart", { data });
    const events = ["dragenter", "dragover", "drop"].map(
      (type) => fire(row(), type, { data }).event,
    );
    document.body.removeEventListener("dragover", ancestor.dragover);
    document.body.removeEventListener("drop", ancestor.drop);
    expect(anyIndicator()).toBeNull();
    expect(sheet().hasAttribute("data-drop")).toBe(false);
    for (const event of events) expect(event.defaultPrevented).toBe(false);
    expect(ancestor.dragover).toHaveBeenCalledTimes(1);
    expect(ancestor.drop).toHaveBeenCalledTimes(1);
    expect(onImage).not.toHaveBeenCalled();
  });

  it.each([
    [
      "a ready FilePicker tile drag",
      { portraitUploads: false, portraitUploadPath: "" },
      { data: { "text/plain": tile("worlds/w/art/hero.png") } },
      1,
    ],
    ["a ready file drop", READY, { files: [png()] }, 1],
    [
      "a blocked file drop",
      { portraitUploads: false, portraitUploadPath: "worlds/w/osc" },
      { files: [png()] },
      0,
    ],
  ] as [string, Record<string, unknown>, Transfer, number][])(
    "keeps %s from reaching the document",
    (_, settings, transfer, images) => {
      setWorld(settings);
      render();
      if (transfer.data) fire(document.body, "dragstart", transfer);
      const outside = { dragover: vi.fn(), drop: vi.fn() };
      document.addEventListener("dragover", outside.dragover);
      document.addEventListener("drop", outside.drop);
      fire(row(), "dragenter", transfer);
      const dragover = fire(row(), "dragover", transfer).event;
      fire(row(), "drop", transfer);
      document.removeEventListener("dragover", outside.dragover);
      document.removeEventListener("drop", outside.drop);
      expect(dragover.defaultPrevented).toBe(true);
      expect(outside.dragover).not.toHaveBeenCalled();
      expect(outside.drop).not.toHaveBeenCalled();
      expect(onImage).toHaveBeenCalledTimes(images);
    },
  );

  it("forgets the cached payload once the drag ends", () => {
    setWorld(READY);
    render();
    fire(document.body, "dragstart", {
      data: { "text/plain": tile("a/b.png") },
    });
    fire(document.body, "dragend");
    fire(sheet(), "dragenter", { data: { "text/plain": "" } });
    expect(overlay()).toBeNull();
  });

  it("warns and does nothing for a non-image file", () => {
    setWorld(READY);
    render();
    const file = new File(["x"], "notes.txt", { type: "text/plain" });
    fire(sheet(), "dragenter", { files: [file] });
    fire(sheet(), "drop", { files: [file] });
    expect(warn).toHaveBeenCalledWith("notes.txt is not an image");
    expect(onImage).not.toHaveBeenCalled();
  });

  it("is inert when the sheet is not editable", () => {
    setWorld(READY);
    render(false);
    const { event } = fire(sheet(), "dragover", { files: [png()] });
    expect(overlay()).toBeNull();
    expect(event.defaultPrevented).toBe(false);
  });
});
