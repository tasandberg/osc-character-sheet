// @vitest-environment jsdom
import { it, expect, vi, beforeEach } from "vitest";
import { act } from "react";
import { PortraitImageDialog } from "@features/portraitImage/PortraitImageDialog";
import { PortraitUploadReportedError } from "@features/portraitImage/applyPortraitImage";
import type {
  ActorImages,
  PortraitImageDrop,
  PortraitImageState,
} from "@features/portraitImage/portraitImageState";
import {
  OFF,
  READY,
  fireDrag,
  mountEach,
  notify,
  png,
  setWorld,
} from "./__fixtures__/dragWorld";

const LINK = "Use same image for portrait and token";
const PLACED = "Update tokens already on scenes";
const SAME: ActorImages = { portrait: "a.png", token: "a.png" };
const DIFFER: ActorImages = { portrait: "a.png", token: "b.png" };
const staged = { kind: "file", file: png } as const;

const onClose = vi.fn();
const onSave = vi.fn<(state: PortraitImageState) => Promise<void>>();
const picked: ((path: string) => void)[] = [];

const dom = mountEach();

beforeEach(() => {
  onClose.mockReset();
  onSave.mockReset().mockResolvedValue();
  picked.length = 0;
  Object.assign(URL, {
    createObjectURL: () => "blob:preview",
    revokeObjectURL: () => {},
  });
  vi.stubGlobal("foundry", {});
  vi.stubGlobal(
    "FilePicker",
    class {
      constructor({ callback }: { callback(p: string): void }) {
        picked.push(callback);
      }
      render() {}
    },
  );
});

const open = (current = SAME, drop?: PortraitImageDrop) =>
  dom.render(
    <PortraitImageDialog
      current={current}
      drop={drop}
      onClose={onClose}
      onSave={onSave}
    />,
  );

const previews = () =>
  dom
    .all('button[aria-label^="Change "]')
    .map((el) => el.querySelector("img")?.getAttribute("src"));
const check = (text: string) =>
  dom
    .all("label")
    .find((l) => l.textContent?.includes(text))!
    .querySelector("input")!;
const button = (name: string) =>
  dom
    .all("button")
    .find(
      (b) => b.textContent === name || b.getAttribute("aria-label") === name,
    ) as HTMLButtonElement;
const click = (el: HTMLElement) => act(async () => el.click());
const BLOB = "blob:preview";

it.each([
  ["matching images", SAME, undefined, true, ["a.png"]],
  ["differing images", DIFFER, undefined, false, ["a.png", "b.png"]],
  ["a portrait-zone drop", SAME, "portrait", false, [BLOB, "a.png"]],
  ["a token-zone drop", SAME, "token", false, ["a.png", BLOB]],
  ["a both-zone drop", DIFFER, "both", true, [BLOB]],
] as const)("opens on %s", (_, current, target, linked, shown) => {
  open(current, target && { image: staged, target });
  expect(check(LINK).checked).toBe(linked);
  expect(previews()).toEqual(shown);
});

it.each([
  [READY, "Browse, drag from the file browser, or drop a file here."],
  [OFF, "Browse, or drag from the file browser."],
])("captions how an image can be set", (settings, hint) => {
  setWorld(settings);
  open();
  expect(dom.container.textContent).toContain(hint);
});

it("links and unlinks the slots, enabling the placed-token box once the token changes", async () => {
  open(DIFFER);
  expect(check(PLACED).disabled).toBe(true);
  await click(check(LINK));
  expect(previews()).toEqual(["a.png"]);
  expect(check(PLACED).disabled).toBe(false);
  await click(check(LINK));
  expect(previews()).toEqual(["a.png", "a.png"]);
});

it("stages the image picked through a slot's Browse link", async () => {
  open(DIFFER);
  await click(button("Browse for a token image"));
  await act(async () => picked[0]("worlds/w/new.png"));
  expect(previews()).toEqual(["a.png", "worlds/w/new.png"]);
});

it("saves a file dropped on a zone inside the dialog, then closes", async () => {
  open(DIFFER);
  fireDrag(button("Browse for a token image"), "dragenter", { files: [png] });
  expect(dom.zoneLabels()).toEqual(["Set portrait", "Set token", "Set both"]);
  fireDrag(dom.zone("token"), "drop", { files: [png] });
  await click(check(PLACED));
  await click(button("Save"));
  expect(onSave).toHaveBeenCalledWith({
    portrait: { kind: "path", src: "a.png" },
    token: staged,
    linked: false,
    updatePlaced: true,
  });
  expect(onClose).toHaveBeenCalledTimes(1);
});

it("shows the gate message and stages nothing for a blocked file drag", () => {
  setWorld(OFF);
  open(DIFFER);
  const target = button("Browse for a token image");
  fireDrag(target, "dragenter", { files: [png] });
  expect(dom.status()).toBe("Portrait uploads not enabled for this world");
  fireDrag(target, "drop", { files: [png] });
  expect(previews()).toEqual(["a.png", "b.png"]);
});

it("closes without saving on Cancel", async () => {
  open(SAME, { image: staged, target: "both" });
  await click(button("Cancel"));
  expect(onSave).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalledTimes(1);
});

it.each([
  [new Error("Couldn't upload"), ["Couldn't upload"]],
  [new PortraitUploadReportedError(), []],
])("stays open after a failed save (%s)", async (failure, toasts) => {
  onSave.mockRejectedValue(failure);
  open(SAME, { image: staged, target: "both" });
  await click(button("Save"));
  expect(notify.error.mock.calls.map(([m]) => m)).toEqual(toasts);
  expect(onClose).not.toHaveBeenCalled();
  expect(button("Save").disabled).toBe(false);
});

it("ignores Cancel and the close button while a save is running", async () => {
  let finish = () => {};
  onSave.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
  open(SAME, { image: staged, target: "both" });
  await click(button("Save"));
  await click(button("Cancel"));
  await click(button("Close"));
  expect(onClose).not.toHaveBeenCalled();
  await act(async () => finish());
  expect(onClose).toHaveBeenCalledTimes(1);
});
