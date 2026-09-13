import { describe, it, expect } from "vitest";
import {
  PortraitUploadReportedError,
  actorImageUpdate,
  portraitUploadFilename,
  tokenUpdatesByScene,
  uploadedPath,
} from "@features/portraitDrop/applyPortraitDrop";
import { directoryChain } from "@features/portraitDrop/uploadFolder";

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

describe("actorImageUpdate", () => {
  it("sets only the portrait", () => {
    expect(actorImageUpdate("a.png", "portrait")).toEqual({ img: "a.png" });
  });

  it("sets only the prototype token", () => {
    expect(actorImageUpdate("a.png", "token")).toEqual({
      "prototypeToken.texture.src": "a.png",
    });
  });

  it("sets both in one update", () => {
    expect(actorImageUpdate("a.png", "both")).toEqual({
      img: "a.png",
      "prototypeToken.texture.src": "a.png",
    });
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
