// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SheetImageDrop } from "@features/portraitImage/SheetImageDrop";
import { usePortraitDrop } from "@features/portraitImage/usePortraitDrop";
import type { ImageDrop } from "@features/portraitImage/parseImageDrop";
import type { PortraitImageTarget } from "@features/portraitImage/portraitImageState";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const tile = (src: string) =>
  JSON.stringify({ type: "Tile", texture: { src }, fromFilePicker: true });

let container: HTMLDivElement;
let root: Root;
const onImage =
  vi.fn<(image: ImageDrop, target: PortraitImageTarget) => void>();
const warn = vi.fn();

function Harness({ enabled = true }: { enabled?: boolean }) {
  const zone = usePortraitDrop({ enabled });
  return (
    <SheetImageDrop zone={zone} onImage={onImage}>
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
    items: [
      ...files.map((f) => ({ kind: "file", type: f.type })),
      ...Object.keys(data).map((type) => ({ kind: "string", type })),
    ],
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
  container.querySelector<HTMLElement>('[data-testid="image-drop-overlay"]');
const zones = () => [
  ...container.querySelectorAll<HTMLElement>('[data-testid="image-drop-zone"]'),
];
const zoneLabels = () => zones().map((el) => el.textContent);
const zone = (target: PortraitImageTarget) =>
  container.querySelector<HTMLElement>(
    `[data-testid="image-drop-zone"][data-target="${target}"]`,
  )!;
const blockedMessage = () =>
  overlay()?.querySelector('[role="status"]')?.textContent;
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

describe("sheet image drop zones", () => {
  it("shows no overlay and no drop state until something is dragged over", () => {
    setWorld(READY);
    render();
    expect(overlay()).toBeNull();
    expect(sheet().hasAttribute("data-drop")).toBe(false);
  });

  it("offers a zone per target while a file is dragged over the sheet", () => {
    setWorld(READY);
    render();
    const file = png();
    fire(sheet(), "dragenter", { files: [file] });
    expect(sheet().getAttribute("data-drop")).toBe("ready");
    expect(zoneLabels()).toEqual(["Set portrait", "Set token", "Set both"]);
    const { event, dataTransfer } = fire(sheet(), "dragover", {
      files: [file],
    });
    expect(event.defaultPrevented).toBe(true);
    expect(dataTransfer.dropEffect).toBe("copy");
  });

  it("offers the zones for a drag over other sheet content", () => {
    setWorld(READY);
    render();
    fire(row(), "dragenter", { files: [png()] });
    expect(sheet().getAttribute("data-drop")).toBe("ready");
    expect(zones()).toHaveLength(3);
  });

  it.each([["portrait"], ["token"], ["both"]] as [PortraitImageTarget][])(
    "hands the file to the %s zone",
    (target) => {
      setWorld(READY);
      render();
      const file = png();
      fire(row(), "dragenter", { files: [file] });
      fire(zone(target), "drop", { files: [file] });
      expect(onImage).toHaveBeenCalledWith({ kind: "file", file }, target);
      expect(overlay()).toBeNull();
      expect(sheet().hasAttribute("data-drop")).toBe(false);
    },
  );

  it("brightens only the zone the drag is over", () => {
    setWorld(READY);
    render();
    fire(sheet(), "dragenter", { files: [png()] });
    fire(zone("token"), "dragenter", { files: [png()] });
    expect(zone("token").classList.contains("is-over")).toBe(true);
    expect(zone("portrait").classList.contains("is-over")).toBe(false);
    fire(zone("token"), "dragleave", { files: [png()] });
    expect(zone("token").classList.contains("is-over")).toBe(false);
  });

  it("stages nothing for a drop that misses every zone", () => {
    setWorld(READY);
    render();
    const file = png();
    fire(row(), "dragenter", { files: [file] });
    const { event } = fire(row(), "drop", { files: [file] });
    expect(event.defaultPrevented).toBe(true);
    expect(onImage).not.toHaveBeenCalled();
    expect(overlay()).toBeNull();
  });

  it("offers no zones and shows the gate message when uploads are off", () => {
    setWorld({
      portraitUploads: false,
      portraitUploadPath: "worlds/w/osc-portraits",
    });
    render();
    const file = png();
    fire(row(), "dragenter", { files: [file] });
    expect(sheet().getAttribute("data-drop")).toBe("blocked");
    expect(zones()).toHaveLength(0);
    expect(blockedMessage()).toBe(
      "Portrait uploads not enabled for this world",
    );
    const { dataTransfer } = fire(sheet(), "dragover", { files: [file] });
    expect(dataTransfer.dropEffect).toBe("none");
    fire(sheet(), "drop", { files: [file] });
    expect(onImage).not.toHaveBeenCalled();
  });

  it("tells a player without upload permission to ask their GM", () => {
    setWorld(READY, { isGM: false, upload: false });
    render();
    fire(sheet(), "dragenter", { files: [png()] });
    expect(blockedMessage()).toBe(
      "Ask your GM to set an upload target for OSC Sheet portraits",
    );
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

  it("accepts a path drag even when uploads are off", () => {
    setWorld({ portraitUploads: false, portraitUploadPath: "" });
    render();
    const data = { "text/uri-list": "https://example.com/hero.webp" };
    fire(sheet(), "dragenter", { data });
    expect(zones()).toHaveLength(3);
    fire(sheet(), "dragover", { data });
    fire(zone("both"), "drop", { data });
    expect(onImage).toHaveBeenCalledWith(
      { kind: "path", src: "https://example.com/hero.webp" },
      "both",
    );
  });

  it("accepts a FilePicker tile drag via the cached dragstart payload", () => {
    setWorld({ portraitUploads: false, portraitUploadPath: "" });
    render();
    const data = { "text/plain": tile("worlds/w/art/hero.png") };
    fire(document.body, "dragstart", { data });
    fire(sheet(), "dragenter", { data: { "text/plain": "" } });
    expect(zones()).toHaveLength(3);
    fire(zone("portrait"), "drop", { data });
    expect(onImage).toHaveBeenCalledWith(
      { kind: "path", src: "worlds/w/art/hero.png" },
      "portrait",
    );
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
    expect(overlay()).toBeNull();
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
      fire(zones().length ? zone("both") : row(), "drop", transfer);
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

  it("shows a non-image file as blocked while it is dragged", () => {
    setWorld(READY);
    render();
    const file = new File(["x"], "notes.txt", { type: "text/plain" });
    fire(row(), "dragenter", { files: [file] });
    expect(sheet().getAttribute("data-drop")).toBe("blocked");
    expect(zones()).toHaveLength(0);
    expect(blockedMessage()).toBe("Only image files can be used for portraits");
    const { event, dataTransfer } = fire(sheet(), "dragover", {
      files: [file],
    });
    expect(event.defaultPrevented).toBe(true);
    expect(dataTransfer.dropEffect).toBe("none");
    fire(sheet(), "drop", { files: [file] });
    expect(onImage).not.toHaveBeenCalled();
    expect(sheet().hasAttribute("data-drop")).toBe(false);
  });

  it("blocks a mixed drag when any file is not an image", () => {
    setWorld(READY);
    render();
    const text = new File(["x"], "notes.txt", { type: "text/plain" });
    fire(sheet(), "dragenter", { files: [png(), text] });
    expect(sheet().getAttribute("data-drop")).toBe("blocked");
  });

  it("keeps the upload gate message for a non-image file when uploads are off", () => {
    setWorld({
      portraitUploads: false,
      portraitUploadPath: "worlds/w/osc-portraits",
    });
    render();
    const file = new File(["x"], "notes.txt", { type: "text/plain" });
    fire(sheet(), "dragenter", { files: [file] });
    expect(blockedMessage()).toBe(
      "Portrait uploads not enabled for this world",
    );
  });

  it("returns to ready once an image replaces a non-image drag", () => {
    setWorld(READY);
    render();
    const text = new File(["x"], "notes.txt", { type: "text/plain" });
    fire(sheet(), "dragenter", { files: [text] });
    fire(sheet(), "dragleave", { files: [text] });
    fire(sheet(), "dragenter", { files: [png()] });
    expect(sheet().getAttribute("data-drop")).toBe("ready");
    expect(zones()).toHaveLength(3);
  });

  it("warns and does nothing for a file of unknown type that is not an image", () => {
    setWorld(READY);
    render();
    const file = new File(["x"], "notes.txt");
    fire(sheet(), "dragenter", { files: [file] });
    expect(sheet().getAttribute("data-drop")).toBe("ready");
    fire(zone("both"), "drop", { files: [file] });
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
