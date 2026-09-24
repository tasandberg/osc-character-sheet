// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SheetImageDrop } from "@features/portraitImage/SheetImageDrop";
import { usePortraitDrop } from "@features/portraitImage/usePortraitDrop";
import type { ImageDrop } from "@features/portraitImage/parseImageDrop";
import type { PortraitImageTarget } from "@features/portraitImage/portraitImageState";
import {
  OFF,
  READY,
  fireDrag,
  mountEach,
  notes,
  notify,
  png,
  setWorld,
  tile,
  type Transfer,
} from "./__fixtures__/dragWorld";

const onImage =
  vi.fn<(image: ImageDrop, target: PortraitImageTarget) => void>();

function Harness({ enabled = true }: { enabled?: boolean }) {
  return (
    <SheetImageDrop zone={usePortraitDrop({ enabled })} onImage={onImage}>
      <div className="row" />
    </SheetImageDrop>
  );
}

const dom = mountEach();
const row = () => dom.get(".row")!;
const ALL_ZONES = ["Set portrait", "Set token", "Set both"];
const BLANK_PATH = { ...READY, portraitUploadPath: " " };

beforeEach(() => {
  onImage.mockClear();
  dom.render(<Harness />);
});

describe("dropping an image on the sheet", () => {
  it.each(["portrait", "token", "both"] as PortraitImageTarget[])(
    "hands a file dropped on the %s zone to that target and clears the overlay",
    (target) => {
      fireDrag(row(), "dragenter", { files: [png] });
      expect(dom.zoneLabels()).toEqual(ALL_ZONES);
      fireDrag(dom.zone(target), "drop", { files: [png] });
      expect(onImage).toHaveBeenCalledWith({ kind: "file", file: png }, target);
      expect(dom.zoneLabels()).toEqual([]);
    },
  );

  it("keeps the overlay while the drag moves between children, and clears it on leave", () => {
    fireDrag(dom.container.firstElementChild!, "dragenter", { files: [png] });
    fireDrag(row(), "dragenter", { files: [png] });
    fireDrag(row(), "dragleave");
    expect(dom.zoneLabels()).toEqual(ALL_ZONES);
    fireDrag(row(), "dragleave");
    expect(dom.zoneLabels()).toEqual([]);
  });

  it("stages nothing for a drop that misses every zone, and keeps it from Foundry", () => {
    const outside = vi.fn();
    document.addEventListener("drop", outside);
    fireDrag(row(), "dragenter", { files: [png] });
    const drop = fireDrag(row(), "drop", { files: [png] });
    document.removeEventListener("drop", outside);
    expect(drop.defaultPrevented).toBe(true);
    expect(outside).not.toHaveBeenCalled();
    expect(onImage).not.toHaveBeenCalled();
  });

  it("warns about a file of unknown type that is not an image", () => {
    const blob = new File(["x"], "notes.txt");
    fireDrag(row(), "dragenter", { files: [blob] });
    fireDrag(dom.zone("both"), "drop", { files: [blob] });
    expect(notify.warn).toHaveBeenCalledWith("notes.txt is not an image");
    expect(onImage).not.toHaveBeenCalled();
  });

  it("is inert when the sheet is not editable", () => {
    dom.render(<Harness enabled={false} />);
    const over = fireDrag(row(), "dragover", { files: [png] });
    expect(over.defaultPrevented).toBe(false);
    expect(dom.zoneLabels()).toEqual([]);
  });
});

describe("blocked file drags", () => {
  it.each([
    [
      "uploads are off",
      { ...READY, portraitUploads: false },
      {},
      png,
      "Portrait uploads not enabled for this world",
    ],
    [
      "a GM has no upload folder",
      BLANK_PATH,
      { isGM: true },
      png,
      "Please set an upload target for OSC Sheet portraits",
    ],
    [
      "a player has no upload folder",
      BLANK_PATH,
      {},
      png,
      "Ask your GM to set an upload target for OSC Sheet portraits",
    ],
    [
      "a player may not upload",
      READY,
      { canUpload: false },
      png,
      "Ask your GM to set an upload target for OSC Sheet portraits",
    ],
    [
      "the file is not an image",
      READY,
      {},
      notes,
      "Only image files can be used for portraits",
    ],
  ])("explain themselves when %s", (_, settings, user, file, message) => {
    setWorld(settings, user);
    dom.render(<Harness key="blocked" />);
    fireDrag(row(), "dragenter", { files: [file] });
    expect(dom.status()).toBe(message);
    expect(dom.zoneLabels()).toEqual([]);
    fireDrag(row(), "drop", { files: [file] });
    expect(onImage).not.toHaveBeenCalled();
  });
});

it("accepts a FilePicker tile with uploads off, reading its payload at dragstart", () => {
  setWorld(OFF);
  dom.render(<Harness key="off" />);
  const data = { "text/plain": tile("worlds/w/art/hero.png") };
  fireDrag(document.body, "dragstart", { data });
  fireDrag(row(), "dragenter", { data: { "text/plain": "" } });
  fireDrag(dom.zone("portrait"), "drop", { data });
  expect(onImage).toHaveBeenCalledWith(
    { kind: "path", src: "worlds/w/art/hero.png" },
    "portrait",
  );
});

it.each([
  ["an inventory reorder", "root:0"],
  ["a Foundry Item", JSON.stringify({ type: "Item", uuid: "Actor.a.Item.b" })],
])("stays out of the way of %s drag", (_, payload) => {
  const transfer: Transfer = { data: { "text/plain": payload } };
  fireDrag(row(), "dragstart", transfer);
  const events = ["dragenter", "dragover", "drop"].map((type) =>
    fireDrag(row(), type, transfer),
  );
  expect(events.some((e) => e.defaultPrevented)).toBe(false);
  expect(dom.zoneLabels()).toEqual([]);
  expect(onImage).not.toHaveBeenCalled();
});
