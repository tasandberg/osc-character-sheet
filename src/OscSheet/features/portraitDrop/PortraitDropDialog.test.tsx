// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PortraitDropDialog } from "@features/portraitDrop/PortraitDropDialog";
import {
  PortraitUploadReportedError,
  type PortraitDropChoice,
} from "@features/portraitDrop/applyPortraitDrop";
import type { ImageDrop } from "@features/portraitDrop/parseImageDrop";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
const onClose = vi.fn();
const onConfirm = vi.fn<(choice: PortraitDropChoice) => Promise<void>>();
const createObjectURL = vi.fn(() => "blob:preview");
const revokeObjectURL = vi.fn();
const error = vi.fn();

const fileDrop: ImageDrop = {
  kind: "file",
  file: new File(["x"], "hero.png", { type: "image/png" }),
};

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  onClose.mockReset();
  onConfirm.mockReset();
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  error.mockClear();
  Object.assign(URL, { createObjectURL, revokeObjectURL });
  (globalThis as { ui?: unknown }).ui = { notifications: { error } };
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete (globalThis as { ui?: unknown }).ui;
});

const render = (drop: ImageDrop = fileDrop) =>
  act(() => {
    root.render(
      <PortraitDropDialog
        drop={drop}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );
  });

const group = (label: string) =>
  container.querySelector<HTMLElement>(
    `[role="group"][aria-label="${label}"]`,
  )!;
const option = (label: string, text: string) =>
  [...group(label).querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent === text,
  )!;
const button = (text: string) =>
  [...container.querySelectorAll<HTMLButtonElement>(".modal-foot button")].find(
    (b) => b.textContent === text,
  )!;
const click = async (el: HTMLElement) => {
  await act(async () => {
    el.click();
  });
};

describe("PortraitDropDialog", () => {
  it("previews a dropped file from an object URL", () => {
    render();
    expect(createObjectURL).toHaveBeenCalledWith(fileDrop.file);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "blob:preview",
    );
  });

  it("previews a path drop directly", () => {
    render({ kind: "path", src: "worlds/w/hero.png" });
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "worlds/w/hero.png",
    );
  });

  it("defaults to setting both, prototype token only", () => {
    render();
    expect(option("Apply to", "Set both").className).toContain("on");
    expect(option("Tokens", "Prototype only").className).toContain("on");
    expect(option("Tokens", "Prototype + linked tokens").disabled).toBe(false);
  });

  it("explains that unlinked placed tokens are left alone", () => {
    render();
    expect(container.textContent).toContain(
      "Unlinked tokens already on scenes keep their image.",
    );
  });

  it("disables the token choice, without hiding it, for Set portrait", async () => {
    render();
    await click(option("Apply to", "Set portrait"));
    expect(option("Tokens", "Prototype only").disabled).toBe(true);
    expect(option("Tokens", "Prototype + linked tokens").disabled).toBe(true);
    await click(option("Apply to", "Set token"));
    expect(option("Tokens", "Prototype + linked tokens").disabled).toBe(false);
  });

  it("writes nothing on Cancel", async () => {
    render();
    await click(option("Tokens", "Prototype + linked tokens"));
    await click(button("Cancel"));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("revokes the preview URL when it closes", () => {
    render();
    act(() => root.unmount());
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview");
    root = createRoot(container);
  });

  it("confirms the chosen options and closes", async () => {
    onConfirm.mockResolvedValue();
    render();
    await click(option("Apply to", "Set token"));
    await click(option("Tokens", "Prototype + linked tokens"));
    await click(button("Confirm"));
    expect(onConfirm).toHaveBeenCalledWith({ target: "token", tokens: "all" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("reports a failed confirm and stays open with the choice intact", async () => {
    onConfirm.mockRejectedValue(
      new Error("Couldn't upload hero.png to worlds/w"),
    );
    render();
    await click(option("Apply to", "Set portrait"));
    await click(button("Confirm"));
    expect(error).toHaveBeenCalledWith("Couldn't upload hero.png to worlds/w");
    expect(onClose).not.toHaveBeenCalled();
    expect(option("Apply to", "Set portrait").className).toContain("on");
    expect(button("Confirm").disabled).toBe(false);
  });

  it("stays open without a second toast when Foundry already reported the failure", async () => {
    onConfirm.mockRejectedValue(new PortraitUploadReportedError());
    render();
    await click(button("Confirm"));
    expect(error).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(button("Confirm").disabled).toBe(false);
  });

  it("locks every close path while a confirm is running", async () => {
    let finish: () => void = () => {};
    onConfirm.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    render();
    await click(button("Confirm"));
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
