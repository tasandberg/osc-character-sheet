import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  PortraitUploadReportedError,
  applyPortraitImage,
  portraitImageToast,
  type PortraitImageActor,
} from "@features/portraitImage/applyPortraitImage";
import type { PortraitImageState } from "@features/portraitImage/portraitImageState";
import { setWorld } from "./__fixtures__/dragWorld";

const file = new File(["x"], "hero.PNG", { type: "image/png" });
const staged = { kind: "file", file } as const;
const path = (src: string) => ({ kind: "path", src }) as const;
const upload = vi.fn();

const scene = (name: string, fails = false) => ({
  name,
  updateEmbeddedDocuments: vi.fn(() =>
    fails ? Promise.reject(new Error("nope")) : Promise.resolve([]),
  ),
});

const actorWith = (tokens: { id: string; parent: unknown }[] = []) => {
  const actor = {
    name: "Sir Grüm the 'Bold'!",
    img: "a.png",
    prototypeToken: { texture: { src: "b.png" } },
    update: vi.fn(() => Promise.resolve()),
    getDependentTokens: vi.fn(() => tokens),
  };
  return actor as typeof actor & PortraitImageActor;
};

const state = (
  portrait: PortraitImageState["portrait"],
  token: PortraitImageState["token"],
  updatePlaced = false,
): PortraitImageState => ({ portrait, token, linked: false, updatePlaced });

beforeEach(() => {
  upload
    .mockReset()
    .mockImplementation((_s, dir, named: File) =>
      Promise.resolve({ status: "success", path: `${dir}/${named.name}` }),
    );
  vi.spyOn(console, "error").mockImplementation(() => {});
  setWorld({ portraitUploadPath: " worlds/w/osc " });
  vi.stubGlobal("foundry", {
    utils: { randomID: () => "id" },
    applications: {
      apps: {
        FilePicker: {
          implementation: {
            createDirectory: () => Promise.reject(new Error("EEXIST")),
            matchS3URL: () => null,
            upload,
          },
        },
      },
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("applyPortraitImage", () => {
  it("uploads a staged file once, under a name slugged from the actor, and writes both images", async () => {
    const actor = actorWith();
    await expect(
      applyPortraitImage(actor, state(staged, staged)),
    ).resolves.toEqual({
      portrait: true,
      token: true,
      placedTokens: 0,
    });
    expect(upload).toHaveBeenCalledTimes(1);
    const src = "worlds/w/osc/sir-grum-the-bold-id.png";
    expect(actor.update).toHaveBeenCalledWith({
      img: src,
      "prototypeToken.texture.src": src,
    });
  });

  it("writes only the image that changed", async () => {
    const actor = actorWith();
    await applyPortraitImage(actor, state(path("a.png"), path("c.png")));
    expect(actor.update).toHaveBeenCalledWith({
      "prototypeToken.texture.src": "c.png",
    });
    expect(upload).not.toHaveBeenCalled();
  });

  it("writes nothing when neither image changed", async () => {
    const actor = actorWith();
    await applyPortraitImage(actor, state(path("a.png"), path("b.png"), true));
    expect(actor.update).not.toHaveBeenCalled();
  });

  it("retextures linked placed tokens, counting only scenes that accepted the update", async () => {
    const keep = scene("Keep");
    const actor = actorWith([
      { id: "t1", parent: keep },
      { id: "t2", parent: scene("Road", true) },
      { id: "t3", parent: keep },
      { id: "t4", parent: null },
    ]);
    const result = await applyPortraitImage(
      actor,
      state(path("a.png"), path("c.png"), true),
    );
    expect(result.placedTokens).toBe(2);
    expect(actor.getDependentTokens).toHaveBeenCalledWith({
      linked: true,
      concreteOnly: true,
    });
    expect(keep.updateEmbeddedDocuments).toHaveBeenCalledWith("Token", [
      { _id: "t1", "texture.src": "c.png" },
      { _id: "t3", "texture.src": "c.png" },
    ]);
  });

  it.each([
    ["the box is off", state(path("a.png"), path("c.png"))],
    ["only the portrait changed", state(path("c.png"), path("b.png"), true)],
  ])("leaves placed tokens alone when %s", async (_, next) => {
    const keep = scene("Keep");
    await applyPortraitImage(actorWith([{ id: "t1", parent: keep }]), next);
    expect(keep.updateEmbeddedDocuments).not.toHaveBeenCalled();
  });

  it.each([
    ["Foundry rejected it", false, PortraitUploadReportedError],
    ["Foundry returned no path", {}, Error],
  ])(
    "fails without writing when the upload fails because %s",
    async (_, response, error) => {
      upload.mockResolvedValue(response);
      const actor = actorWith();
      await expect(
        applyPortraitImage(actor, state(staged, path("b.png"))),
      ).rejects.toBeInstanceOf(error);
      expect(actor.update).not.toHaveBeenCalled();
    },
  );
});

it("summarises what changed for the toast", () => {
  const toast = (portrait: boolean, token: boolean, placedTokens: number) =>
    portraitImageToast({ portrait, token, placedTokens });
  expect(toast(false, false, 0)).toBeNull();
  expect(toast(true, false, 0)).toEqual({ title: "Portrait updated" });
  expect(toast(false, true, 1)).toEqual({
    title: "Token updated",
    message: "Also updated 1 placed token",
  });
  expect(toast(true, true, 2)).toEqual({
    title: "Portrait and token updated",
    message: "Also updated 2 placed tokens",
  });
});
