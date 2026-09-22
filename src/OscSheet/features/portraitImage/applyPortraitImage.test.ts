import { describe, it, expect, vi, afterEach } from "vitest";
import {
  PortraitUploadReportedError,
  actorPortraitImages,
  applyPortraitImage,
  portraitImageToast,
  type PortraitImageActor,
  portraitUploadFilename,
  tokenUpdatesByScene,
  uploadedPath,
} from "@features/portraitImage/applyPortraitImage";
import {
  initialPortraitImageState,
  linkPortraitImage,
  setPortraitImageSlot,
  type PortraitImageState,
} from "@features/portraitImage/portraitImageState";
import { directoryChain } from "@features/portraitImage/uploadFolder";

describe("portraitUploadFilename", () => {
  it("slugs the actor name and keeps the image extension", () => {
    expect(portraitUploadFilename("Sir Reginald", "hero.PNG", "abc123")).toBe(
      "sir-reginald-abc123.png",
    );
  });

  it("strips punctuation and collapses separators", () => {
    expect(
      portraitUploadFilename("  Grüm  the 'Bold'!! ", "a.webp", "id"),
    ).toBe("grum-the-bold-id.webp");
  });

  it("falls back when the name has nothing sluggable", () => {
    expect(portraitUploadFilename("???", "a.jpg", "id")).toBe(
      "portrait-id.jpg",
    );
  });

  it("uses png when the file name has no image extension", () => {
    expect(portraitUploadFilename("Ana", "clipboard", "id")).toBe("ana-id.png");
  });
});

describe("tokenUpdatesByScene", () => {
  const keep = { name: "Keep" };
  const road = { name: "Road" };

  it("groups texture updates by each token's scene", () => {
    const grouped = tokenUpdatesByScene(
      [
        { id: "t1", parent: keep },
        { id: "t2", parent: road },
        { id: "t3", parent: keep },
      ],
      "a.png",
    );
    expect([...grouped]).toEqual([
      [
        keep,
        [
          { _id: "t1", "texture.src": "a.png" },
          { _id: "t3", "texture.src": "a.png" },
        ],
      ],
      [road, [{ _id: "t2", "texture.src": "a.png" }]],
    ]);
  });

  it("skips tokens with no scene", () => {
    expect(
      tokenUpdatesByScene([{ id: "t1", parent: null }], "a.png").size,
    ).toBe(0);
  });
});

describe("directoryChain", () => {
  it("lists each ancestor folder, shallowest first", () => {
    expect(directoryChain("worlds/w/osc-portraits")).toEqual([
      "worlds",
      "worlds/w",
      "worlds/w/osc-portraits",
    ]);
  });

  it("ignores leading, trailing and doubled slashes", () => {
    expect(directoryChain("/a//b/")).toEqual(["a", "a/b"]);
  });
});

describe("uploadedPath", () => {
  const thrown = (response: Parameters<typeof uploadedPath>[0]) => {
    try {
      uploadedPath(response, "hero.png", "worlds/w/osc");
    } catch (error) {
      return error;
    }
    return null;
  };

  it("returns the path Foundry stored the upload at", () => {
    expect(
      uploadedPath(
        { status: "success", path: "worlds/w/osc/hero.png" },
        "hero.png",
        "worlds/w/osc",
      ),
    ).toBe("worlds/w/osc/hero.png");
  });

  it("throws the already-reported error when Foundry rejected the upload", () => {
    expect(thrown(false)).toBeInstanceOf(PortraitUploadReportedError);
  });

  it.each([
    ["no response", undefined],
    ["an empty response", {}],
  ])("throws its own error for %s", (_, response) => {
    const error = thrown(response);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(PortraitUploadReportedError);
    expect((error as Error).message).toBe(
      "Couldn't upload hero.png to worlds/w/osc",
    );
  });
});

describe("applyPortraitImage", () => {
  const UPLOADED = "worlds/w/osc/ana-id.png";

  const scene = (name: string, fails = false) => ({
    name,
    updateEmbeddedDocuments: vi.fn(() =>
      fails ? Promise.reject(new Error("nope")) : Promise.resolve([]),
    ),
  });

  const actorWith = (
    tokens: { id: string; parent: unknown }[] = [],
    images = { portrait: "a.png", token: "a.png" },
  ) => {
    const actor = {
      name: "Ana",
      img: images.portrait,
      prototypeToken: { texture: { src: images.token } },
      update: vi.fn(() => Promise.resolve()),
      getDependentTokens: vi.fn(() => tokens),
    };
    return actor as typeof actor & PortraitImageActor;
  };

  const stubUploads = () => {
    const upload = vi
      .fn()
      .mockResolvedValue({ status: "success", path: UPLOADED });
    Object.assign(globalThis, {
      game: {
        settings: {
          get: (ns: string, key: string) =>
            `${ns}.${key}` === "osc-character-sheet.portraitUploadPath"
              ? "worlds/w/osc"
              : undefined,
        },
      },
      foundry: {
        utils: { randomID: () => "id" },
        applications: {
          apps: {
            FilePicker: {
              implementation: {
                createDirectory: vi.fn().mockResolvedValue({}),
                matchS3URL: () => null,
                upload,
              },
            },
          },
        },
      },
    });
    return { upload };
  };

  afterEach(() => {
    const g = globalThis as Record<string, unknown>;
    delete g.game;
    delete g.foundry;
  });

  const actorPortraitState = (actor: PortraitImageActor) =>
    initialPortraitImageState(actorPortraitImages(actor));

  const staged = (
    state: PortraitImageState,
    file = new File(["x"], "hero.png", { type: "image/png" }),
  ) => setPortraitImageSlot(state, "portrait", { kind: "file", file });

  it("uploads a linked file once and writes both image keys", async () => {
    const { upload } = stubUploads();
    const actor = actorWith();
    const state = staged(actorPortraitState(actor));
    await expect(applyPortraitImage(actor, state)).resolves.toEqual({
      portrait: true,
      token: true,
      placedTokens: 0,
    });
    expect(upload).toHaveBeenCalledTimes(1);
    expect(actor.update).toHaveBeenCalledWith({
      img: UPLOADED,
      "prototypeToken.texture.src": UPLOADED,
    });
  });

  it("writes only the key that changed", async () => {
    const actor = actorWith([], { portrait: "a.png", token: "b.png" });
    const state = setPortraitImageSlot(actorPortraitState(actor), "token", {
      kind: "path",
      src: "c.png",
    });
    await expect(applyPortraitImage(actor, state)).resolves.toEqual({
      portrait: false,
      token: true,
      placedTokens: 0,
    });
    expect(actor.update).toHaveBeenCalledWith({
      "prototypeToken.texture.src": "c.png",
    });
  });

  it("counts the placed tokens it retextured", async () => {
    const keep = scene("Keep");
    const road = scene("Road");
    const actor = actorWith(
      [
        { id: "t1", parent: keep },
        { id: "t2", parent: road },
        { id: "t3", parent: keep },
      ],
      { portrait: "a.png", token: "b.png" },
    );
    const state = {
      ...linkPortraitImage(actorPortraitState(actor), true),
      updatePlaced: true,
    };
    await expect(applyPortraitImage(actor, state)).resolves.toEqual({
      portrait: false,
      token: true,
      placedTokens: 3,
    });
    expect(actor.getDependentTokens).toHaveBeenCalledWith({
      linked: true,
      concreteOnly: true,
    });
  });

  it("leaves out tokens in scenes whose update failed", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const actor = actorWith(
      [
        { id: "t1", parent: scene("Keep") },
        { id: "t2", parent: scene("Road", true) },
      ],
      { portrait: "a.png", token: "b.png" },
    );
    const state = {
      ...linkPortraitImage(actorPortraitState(actor), true),
      updatePlaced: true,
    };
    await expect(applyPortraitImage(actor, state)).resolves.toMatchObject({
      placedTokens: 1,
    });
    error.mockRestore();
  });

  it("touches no placed tokens while the box is off", async () => {
    const actor = actorWith([{ id: "t1", parent: scene("Keep") }], {
      portrait: "a.png",
      token: "b.png",
    });
    const state = linkPortraitImage(actorPortraitState(actor), true);
    await expect(applyPortraitImage(actor, state)).resolves.toMatchObject({
      token: true,
      placedTokens: 0,
    });
    expect(actor.getDependentTokens).not.toHaveBeenCalled();
  });

  it("touches no placed tokens when only the portrait changed", async () => {
    const actor = actorWith([{ id: "t1", parent: scene("Keep") }], {
      portrait: "a.png",
      token: "b.png",
    });
    const state = {
      ...setPortraitImageSlot(actorPortraitState(actor), "portrait", {
        kind: "path",
        src: "c.png",
      }),
      updatePlaced: true,
    };
    await expect(applyPortraitImage(actor, state)).resolves.toMatchObject({
      portrait: true,
      token: false,
      placedTokens: 0,
    });
    expect(actor.getDependentTokens).not.toHaveBeenCalled();
  });

  it("writes nothing when neither image changed", async () => {
    const actor = actorWith([], { portrait: "a.png", token: "b.png" });
    await expect(
      applyPortraitImage(actor, {
        ...actorPortraitState(actor),
        updatePlaced: true,
      }),
    ).resolves.toEqual({ portrait: false, token: false, placedTokens: 0 });
    expect(actor.update).not.toHaveBeenCalled();
    expect(actor.getDependentTokens).not.toHaveBeenCalled();
  });
});

describe("actorPortraitImages", () => {
  it("reads the portrait and prototype token sources", () => {
    expect(
      actorPortraitImages({
        img: "a.png",
        prototypeToken: { texture: { src: "b.png" } },
      } as PortraitImageActor),
    ).toEqual({ portrait: "a.png", token: "b.png" });
  });

  it("treats missing sources as empty", () => {
    expect(
      actorPortraitImages({
        img: null,
        prototypeToken: { texture: { src: null } },
      } as unknown as PortraitImageActor),
    ).toEqual({ portrait: "", token: "" });
  });
});

describe("portraitImageToast", () => {
  it.each([
    ["a portrait", { portrait: true, token: false }, "Portrait updated"],
    ["a token", { portrait: false, token: true }, "Token updated"],
    ["both", { portrait: true, token: true }, "Portrait and token updated"],
  ])("titles %s update", (_, changed, title) => {
    expect(portraitImageToast({ ...changed, placedTokens: 0 })).toEqual({
      title,
    });
  });

  it("has nothing to report when nothing changed", () => {
    expect(
      portraitImageToast({ portrait: false, token: false, placedTokens: 0 }),
    ).toBeNull();
  });

  it("mentions a single placed token", () => {
    expect(
      portraitImageToast({ portrait: false, token: true, placedTokens: 1 }),
    ).toEqual({
      title: "Token updated",
      message: "Also updated 1 placed token",
    });
  });

  it("mentions several placed tokens", () => {
    expect(
      portraitImageToast({ portrait: true, token: true, placedTokens: 2 })
        ?.message,
    ).toBe("Also updated 2 placed tokens");
  });
});
