// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import path from "node:path";
import postcss from "postcss";
import { compile } from "sass-embedded";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PortraitImageDialog } from "@features/portraitImage/PortraitImageDialog";
import { PortraitUploadReportedError } from "@features/portraitImage/applyPortraitImage";
import type {
  ActorImages,
  ImageSlot,
  PortraitImageDrop,
  PortraitImageState,
  PortraitImageTarget,
} from "@features/portraitImage/portraitImageState";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
const onClose = vi.fn();
const onSave = vi.fn<(state: PortraitImageState) => Promise<void>>();
const createObjectURL = vi.fn(() => "blob:preview");
const revokeObjectURL = vi.fn();
const error = vi.fn();
const warn = vi.fn();

const file = new File(["x"], "hero.png", { type: "image/png" });
const image: ImageSlot = { kind: "file", file };
const drop = (target: PortraitImageTarget): PortraitImageDrop => ({
  image,
  target,
});
const SAME: ActorImages = { portrait: "a.png", token: "a.png" };
const DIFFER: ActorImages = { portrait: "a.png", token: "b.png" };

const READY = {
  portraitUploads: true,
  portraitUploadPath: "worlds/w/osc-portraits",
};

function setWorld(settings: Record<string, unknown> = READY) {
  const store = new Map(
    Object.entries(settings).map(([k, v]) => [`osc-character-sheet.${k}`, v]),
  );
  (globalThis as { game?: unknown }).game = {
    settings: {
      get: (ns: string, key: string) => store.get(`${ns}.${key}`),
      set: vi.fn(),
    },
    user: { isGM: false, can: (perm: string) => perm === "FILES_UPLOAD" },
  };
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  onClose.mockReset();
  onSave.mockReset();
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  error.mockClear();
  warn.mockClear();
  Object.assign(URL, { createObjectURL, revokeObjectURL });
  (globalThis as { ui?: unknown }).ui = { notifications: { error, warn } };
  opened.length = 0;
  (globalThis as { foundry?: unknown }).foundry = {};
  (globalThis as { FilePicker?: unknown }).FilePicker = class {
    constructor(options: PickerOptions) {
      opened.push(options);
    }
    render() {}
  };
  setWorld();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete (globalThis as { ui?: unknown }).ui;
  delete (globalThis as { game?: unknown }).game;
  delete (globalThis as { foundry?: unknown }).foundry;
  delete (globalThis as { FilePicker?: unknown }).FilePicker;
});

type RenderOptions = {
  current?: ActorImages;
  drop?: PortraitImageDrop | null;
  canDropImages?: boolean;
};

const render = ({
  current = SAME,
  drop: dropped = null,
  canDropImages = true,
}: RenderOptions = {}) =>
  act(() => {
    root.render(
      <PortraitImageDialog
        current={current}
        drop={dropped}
        canDropImages={canDropImages}
        onClose={onClose}
        onSave={onSave}
      />,
    );
  });

const slot = (label: string) =>
  container.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`);
const slotSrc = (label: string) =>
  slot(label)?.querySelector("img")?.getAttribute("src");
const slots = () => container.querySelectorAll(".ed-portrait").length;
const slotRow = () =>
  container.querySelector<HTMLElement>(".osc-portrait-image-slots")!;
const slotClassNames = () => [
  ...new Set(
    [...container.querySelectorAll<HTMLElement>(".ed-portrait")].map(
      (el) => el.className,
    ),
  ),
];
const check = (text: string) =>
  [...container.querySelectorAll<HTMLLabelElement>("label.check")]
    .find((l) => l.textContent?.includes(text))!
    .querySelector<HTMLInputElement>("input")!;
const label = (text: string) =>
  [...container.querySelectorAll<HTMLElement>(".field-label")].find(
    (l) => l.textContent === text,
  );
const button = (text: string) =>
  [...container.querySelectorAll<HTMLButtonElement>(".modal-foot button")].find(
    (b) => b.textContent === text,
  )!;
const click = async (el: HTMLElement) => {
  await act(async () => {
    el.click();
  });
};

const zones = () => [
  ...container.querySelectorAll<HTMLElement>('[data-testid="image-drop-zone"]'),
];
const zoneLabels = () => zones().map((el) => el.textContent);
const zone = (target: PortraitImageTarget) =>
  container.querySelector<HTMLElement>(
    `[data-testid="image-drop-zone"][data-target="${target}"]`,
  )!;
const status = () =>
  container.querySelector<HTMLElement>('[role="status"]')?.textContent;
const slotHint = () =>
  container.querySelector<HTMLElement>(
    ".osc-portrait-image-group > .field-hint",
  )?.textContent;
const browse = (name: string) =>
  [...container.querySelectorAll<HTMLButtonElement>("button.inline-btn")].find(
    (el) => el.getAttribute("aria-label") === name,
  );
const browseCount = () =>
  container.querySelectorAll("button.osc-portrait-image-browse").length;

const dropCss = compile(
  path.resolve(__dirname, "../../styles/portrait-image.scss"),
).css;
const positionOf = (selector: string) => {
  let value: string | undefined;
  postcss.parse(dropCss).walkRules((rule) => {
    if (rule.selector !== selector) return;
    for (const node of rule.nodes)
      if (node.type === "decl" && node.prop === "position") value = node.value;
  });
  return value;
};

const flowHtml = () => {
  const body = container
    .querySelector<HTMLElement>(".modal-body")!
    .cloneNode(true) as HTMLElement;
  for (const el of body.querySelectorAll(
    '[data-testid="image-drop-zone"], .osc-image-drop-alert',
  ))
    el.remove();
  return body.innerHTML;
};

type PickerOptions = {
  type: string;
  current: string;
  callback(p: string): void;
};
const opened: PickerOptions[] = [];

type Transfer = { files?: File[]; data?: Record<string, string> };

function fire(
  el: EventTarget,
  type: string,
  { files = [], data = {} }: Transfer = {},
) {
  const event = new Event(type, { bubbles: true, cancelable: true });
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
  Object.defineProperty(event, "dataTransfer", { value: dataTransfer });
  act(() => {
    el.dispatchEvent(event);
  });
  return { event, dataTransfer };
}

const dragOver = (transfer: Transfer) => fire(slotRow(), "dragenter", transfer);

describe("PortraitImageDialog", () => {
  it("opens from a click with one shared slot on the actor's image", () => {
    render();
    expect(slots()).toBe(1);
    expect(check("Use same image for portrait and token").checked).toBe(true);
    expect(slotSrc("Change portrait and token image")).toBe("a.png");
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("opens from a click on differing images with both slots", () => {
    render({ current: DIFFER });
    expect(check("Use same image for portrait and token").checked).toBe(false);
    expect(slotSrc("Change portrait image")).toBe("a.png");
    expect(slotSrc("Change token image")).toBe("b.png");
    expect(label("Portrait")).toBeTruthy();
    expect(label("Token")).toBeTruthy();
  });

  it("sizes the linked slot from the shared row, not from its image", () => {
    render();
    expect(slotRow().classList.contains("is-split")).toBe(false);
    expect(slots()).toBe(1);
  });

  it("gives both unlinked slots the same sizing classes", () => {
    render({ current: DIFFER });
    expect(slotRow().classList.contains("is-split")).toBe(true);
    expect(slots()).toBe(2);
    expect(slotClassNames()).toHaveLength(1);
  });

  it("previews an image dropped on the sheet's both zone in the shared slot", () => {
    render({ current: DIFFER, drop: drop("both") });
    expect(check("Use same image for portrait and token").checked).toBe(true);
    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(slotSrc("Change portrait and token image")).toBe("blob:preview");
  });

  it("previews an image dropped on the sheet's portrait zone in that slot only", () => {
    render({ drop: drop("portrait") });
    expect(check("Use same image for portrait and token").checked).toBe(false);
    expect(slotSrc("Change portrait image")).toBe("blob:preview");
    expect(slotSrc("Change token image")).toBe("a.png");
  });

  it("previews an image dropped on the sheet's token zone in that slot only", () => {
    render({ drop: drop("token") });
    expect(slotSrc("Change portrait image")).toBe("a.png");
    expect(slotSrc("Change token image")).toBe("blob:preview");
  });

  it("collapses to one slot when the images are linked, and expands again", async () => {
    render({ current: DIFFER });
    await click(check("Use same image for portrait and token"));
    expect(slots()).toBe(1);
    expect(slotSrc("Change portrait and token image")).toBe("a.png");
    await click(check("Use same image for portrait and token"));
    expect(slots()).toBe(2);
    expect(slotSrc("Change token image")).toBe("a.png");
  });

  it("disables the placed-token box until the token image changes", async () => {
    render({ current: DIFFER });
    expect(check("Update tokens already on scenes").disabled).toBe(true);
    await click(check("Use same image for portrait and token"));
    expect(check("Update tokens already on scenes").disabled).toBe(false);
  });

  it("explains that unlinked placed tokens are left alone", () => {
    render();
    expect(container.textContent).toContain(
      "Unlinked tokens already on scenes keep their image.",
    );
  });

  it("captions the slots with every way to set an image when uploads are on", () => {
    render();
    expect(slotHint()).toBe(
      "Browse, drag from the file browser, or drop a file here.",
    );
  });

  it("drops the file-drop option from the caption when uploads are off", () => {
    render({ canDropImages: false });
    expect(slotHint()).toBe("Browse, or drag from the file browser.");
  });

  describe("Browse", () => {
    it("puts a Browse link under each square without unlabelling the square", () => {
      render({ current: DIFFER });
      expect(browseCount()).toBe(2);
      expect(browse("Browse for a portrait image")?.textContent).toBe("Browse");
      expect(browse("Browse for a token image")?.textContent).toBe("Browse");
      expect(slot("Change portrait image")).toBeTruthy();
      expect(slot("Change token image")).toBeTruthy();
    });

    it("puts a single Browse link under the shared square while linked", () => {
      render();
      expect(browseCount()).toBe(1);
      expect(browse("Browse for a portrait and token image")).toBeTruthy();
      expect(slot("Change portrait and token image")).toBeTruthy();
    });

    it("opens the same picker from the square and from its Browse link", async () => {
      render({ current: DIFFER });
      await click(slot("Change portrait image")!);
      await click(browse("Browse for a portrait image")!);
      expect(opened.map(({ type, current }) => ({ type, current }))).toEqual([
        { type: "image", current: "a.png" },
        { type: "image", current: "a.png" },
      ]);
    });

    it("stages the slot the Browse link belongs to", async () => {
      render({ current: DIFFER });
      await click(browse("Browse for a token image")!);
      await act(async () => {
        opened[0].callback("worlds/w/art/new.png");
      });
      expect(slotSrc("Change token image")).toBe("worlds/w/art/new.png");
      expect(slotSrc("Change portrait image")).toBe("a.png");
    });
  });

  describe("layout stability", () => {
    it("shows and hides the zones without disturbing the rest of the flow", () => {
      render({ current: DIFFER });
      const resting = flowHtml();
      dragOver({ files: [file] });
      expect(zones()).toHaveLength(3);
      expect(flowHtml()).toBe(resting);
      fire(slotRow(), "dragleave", { files: [file] });
      expect(zones()).toHaveLength(0);
      expect(flowHtml()).toBe(resting);
    });

    it("shows the blocked message without disturbing the rest of the flow", () => {
      setWorld({ portraitUploads: false, portraitUploadPath: "" });
      render({ current: DIFFER });
      const resting = flowHtml();
      dragOver({ files: [file] });
      expect(status()).toBe("Portrait uploads not enabled for this world");
      expect(flowHtml()).toBe(resting);
    });

    it("anchors every drag surface to the slot row and keeps it out of flow", () => {
      render({ current: DIFFER });
      dragOver({ files: [file] });
      for (const el of zones()) expect(slotRow().contains(el)).toBe(true);
      expect(positionOf(".osc-sheet-app .osc-portrait-image-slots")).toBe(
        "relative",
      );
      expect(positionOf(".osc-portrait-image-slot .osc-image-drop-zone")).toBe(
        "absolute",
      );
      expect(positionOf(".osc-image-drop-bar")).toBe("absolute");
      expect(positionOf(".osc-image-drop-alert")).toBe("absolute");
    });
  });

  describe("dragging an image over the dialog", () => {
    it("offers a zone per slot plus a full-width both zone while split", () => {
      render({ current: DIFFER });
      expect(zones()).toHaveLength(0);
      dragOver({ files: [file] });
      expect(zoneLabels()).toEqual(["Set portrait", "Set token", "Set both"]);
      expect(zone("both").classList.contains("osc-image-drop-bar")).toBe(true);
      expect(slots()).toBe(2);
      expect(slotRow().classList.contains("is-split")).toBe(true);
    });

    it("offers only the shared slot as a both zone while linked", () => {
      render();
      dragOver({ files: [file] });
      expect(zoneLabels()).toEqual(["Set both"]);
      expect(zone("both").classList.contains("osc-image-drop-bar")).toBe(false);
      expect(slots()).toBe(1);
    });

    it("brightens only the zone the drag is over", () => {
      render({ current: DIFFER });
      dragOver({ files: [file] });
      fire(zone("portrait"), "dragenter", { files: [file] });
      expect(zone("portrait").classList.contains("is-over")).toBe(true);
      expect(zone("token").classList.contains("is-over")).toBe(false);
    });

    it("stages the portrait slot only for a portrait-zone drop", async () => {
      onSave.mockResolvedValue();
      render({ current: DIFFER });
      dragOver({ files: [file] });
      fire(zone("portrait"), "drop", { files: [file] });
      expect(check("Use same image for portrait and token").checked).toBe(
        false,
      );
      expect(slotSrc("Change portrait image")).toBe("blob:preview");
      expect(slotSrc("Change token image")).toBe("b.png");
      expect(zones()).toHaveLength(0);
      await click(button("Save"));
      expect(onSave).toHaveBeenCalledWith({
        portrait: image,
        token: { kind: "path", src: "b.png" },
        linked: false,
        updatePlaced: false,
      });
    });

    it("stages the token slot only for a token-zone drop", async () => {
      onSave.mockResolvedValue();
      render({ current: DIFFER });
      dragOver({ files: [file] });
      fire(zone("token"), "drop", { files: [file] });
      expect(check("Use same image for portrait and token").checked).toBe(
        false,
      );
      expect(slotSrc("Change portrait image")).toBe("a.png");
      expect(slotSrc("Change token image")).toBe("blob:preview");
      await click(button("Save"));
      expect(onSave).toHaveBeenCalledWith({
        portrait: { kind: "path", src: "a.png" },
        token: image,
        linked: false,
        updatePlaced: false,
      });
    });

    it("stages both slots and ticks the link box for a both-zone drop", async () => {
      onSave.mockResolvedValue();
      render({ current: DIFFER });
      dragOver({ files: [file] });
      fire(zone("both"), "drop", { files: [file] });
      expect(check("Use same image for portrait and token").checked).toBe(true);
      expect(slots()).toBe(1);
      expect(slotSrc("Change portrait and token image")).toBe("blob:preview");
      await click(button("Save"));
      expect(onSave).toHaveBeenCalledWith({
        portrait: image,
        token: image,
        linked: true,
        updatePlaced: false,
      });
    });

    it("stages a FilePicker tile path even when uploads are off", () => {
      setWorld({ portraitUploads: false, portraitUploadPath: "" });
      render({ current: DIFFER });
      const data = { "text/plain": "worlds/w/art/hero.png" };
      dragOver({ data });
      expect(zones()).toHaveLength(0);
      fire(document.body, "dragstart", { data });
      dragOver({ data: { "text/plain": "" } });
      expect(zones()).toHaveLength(3);
      fire(zone("token"), "drop", { data });
      expect(slotSrc("Change token image")).toBe("worlds/w/art/hero.png");
    });

    it("offers no zones and shows the gate message for a blocked file drag", () => {
      setWorld({ portraitUploads: false, portraitUploadPath: "" });
      render({ current: DIFFER });
      dragOver({ files: [file] });
      expect(zones()).toHaveLength(0);
      expect(status()).toBe("Portrait uploads not enabled for this world");
      fire(slotRow(), "drop", { files: [file] });
      expect(slotSrc("Change portrait image")).toBe("a.png");
      expect(slotSrc("Change token image")).toBe("b.png");
    });

    it("offers no zones for a non-image file drag", () => {
      render({ current: DIFFER });
      dragOver({
        files: [new File(["x"], "notes.txt", { type: "text/plain" })],
      });
      expect(zones()).toHaveLength(0);
      expect(status()).toBe("Only image files can be used for portraits");
    });

    it("clears the zones when the drag leaves", () => {
      render({ current: DIFFER });
      dragOver({ files: [file] });
      fire(slotRow(), "dragleave", { files: [file] });
      expect(zones()).toHaveLength(0);
    });
  });

  it("writes nothing on Cancel", async () => {
    render({ current: DIFFER, drop: drop("portrait") });
    await click(check("Use same image for portrait and token"));
    await click(button("Cancel"));
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("revokes the staged preview URL when it closes", () => {
    render({ drop: drop("both") });
    act(() => root.unmount());
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview");
    root = createRoot(container);
  });

  it("saves the staged state and closes", async () => {
    onSave.mockResolvedValue();
    render({ current: DIFFER, drop: drop("portrait") });
    await click(check("Use same image for portrait and token"));
    await click(check("Update tokens already on scenes"));
    await click(button("Save"));
    expect(onSave).toHaveBeenCalledWith({
      portrait: image,
      token: image,
      linked: true,
      updatePlaced: true,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("reports a failed save and stays open with the staging intact", async () => {
    onSave.mockRejectedValue(new Error("Couldn't upload hero.png to worlds/w"));
    render({ current: DIFFER, drop: drop("portrait") });
    await click(check("Use same image for portrait and token"));
    await click(button("Save"));
    expect(error).toHaveBeenCalledWith("Couldn't upload hero.png to worlds/w");
    expect(onClose).not.toHaveBeenCalled();
    expect(check("Use same image for portrait and token").checked).toBe(true);
    expect(button("Save").disabled).toBe(false);
  });

  it("stays open without a second toast when Foundry already reported the failure", async () => {
    onSave.mockRejectedValue(new PortraitUploadReportedError());
    render({ drop: drop("both") });
    await click(button("Save"));
    expect(error).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(button("Save").disabled).toBe(false);
  });

  it("locks every close path while a save is running", async () => {
    let finish: () => void = () => {};
    onSave.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    render({ drop: drop("both") });
    await click(button("Save"));
    expect(button("Cancel").disabled).toBe(true);
    await click(container.querySelector<HTMLElement>(".modal-head .x")!);
    const scrim = container.querySelector<HTMLElement>(".modal-scrim")!;
    act(() => {
      for (const type of ["pointerdown", "pointerup", "click"])
        scrim.dispatchEvent(new MouseEvent(type, { bubbles: true }));
    });
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => {
      finish();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
