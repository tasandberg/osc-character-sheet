import { describe, it, expect } from "vitest";
import {
  dragKind,
  imagePathFromPayload,
  isImagePath,
  parseImageDrop,
} from "@features/portraitDrop/parseImageDrop";

const tilePayload = (src: string) =>
  JSON.stringify({ type: "Tile", texture: { src }, fromFilePicker: true });

type TransferInit = {
  files?: File[];
  data?: Record<string, string>;
};

const transfer = ({ files = [], data = {} }: TransferInit) => ({
  files,
  types: [...(files.length ? ["Files"] : []), ...Object.keys(data)],
  getData: (type: string) => data[type] ?? "",
});

const opts = { preferFile: true, origin: "http://localhost:30000" };

const file = (name: string, type: string) => new File(["x"], name, { type });

describe("isImagePath", () => {
  it.each([
    "worlds/w/a.png",
    "a.jpg",
    "a.JPEG",
    "a.webp",
    "a.gif",
    "a.svg",
    "a.avif",
    "a.bmp",
    "a.tiff",
    "a.apng",
    "https://example.com/art/hero.png?size=large#top",
  ])("accepts %s", (src) => {
    expect(isImagePath(src)).toBe(true);
  });

  it.each(["a.txt", "a.mp4", "a.webm", "a.pdf", "noext", "", "png"])(
    "rejects %s",
    (src) => {
      expect(isImagePath(src)).toBe(false);
    },
  );
});

describe("imagePathFromPayload", () => {
  it("reads the FilePicker tile shape", () => {
    expect(imagePathFromPayload(tilePayload("worlds/w/hero.webp"))).toBe(
      "worlds/w/hero.webp",
    );
  });

  it("rejects a tile payload whose texture is not an image", () => {
    expect(imagePathFromPayload(tilePayload("sounds/boom.ogg"))).toBeNull();
  });

  it("reads a raw image path", () => {
    expect(imagePathFromPayload("icons/svg/mystery-man.svg")).toBe(
      "icons/svg/mystery-man.svg",
    );
  });

  it("reads a raw image URL, trimmed", () => {
    expect(imagePathFromPayload("  https://example.com/a.png\n")).toBe(
      "https://example.com/a.png",
    );
  });

  it("ignores document drag payloads", () => {
    expect(
      imagePathFromPayload(
        JSON.stringify({ type: "Item", uuid: "Actor.a.Item.b" }),
      ),
    ).toBeNull();
  });

  it("ignores non-image text and empty input", () => {
    expect(imagePathFromPayload("just some words")).toBeNull();
    expect(imagePathFromPayload("")).toBeNull();
    expect(imagePathFromPayload(null)).toBeNull();
  });
});

describe("dragKind", () => {
  it("is a file drag when Files is present", () => {
    expect(dragKind(["Files"], null, true)).toBe("file");
    expect(dragKind(["Files"], null, false)).toBe("file");
  });

  it("prefers Files over a path when uploads are ready", () => {
    expect(dragKind(["text/uri-list", "Files"], null, true)).toBe("file");
  });

  it("falls back to the path when uploads are not ready", () => {
    expect(dragKind(["text/uri-list", "Files"], null, false)).toBe("path");
  });

  it("is a path drag for a uri-list", () => {
    expect(dragKind(["text/uri-list", "text/html"], null, true)).toBe("path");
  });

  it("is a path drag for text/plain only with a cached image payload", () => {
    expect(dragKind(["text/plain"], tilePayload("a/b.png"), true)).toBe("path");
    expect(dragKind(["text/plain"], "a/b.png", false)).toBe("path");
  });

  it("ignores text/plain with no cached payload", () => {
    expect(dragKind(["text/plain"], null, true)).toBeNull();
  });

  it("ignores text/plain whose cached payload is not an image", () => {
    expect(
      dragKind(
        ["text/plain"],
        JSON.stringify({ type: "Item", uuid: "x" }),
        true,
      ),
    ).toBeNull();
  });

  it("ignores drags with no usable types", () => {
    expect(dragKind([], null, true)).toBeNull();
    expect(dragKind(["text/html"], "a.png", true)).toBeNull();
  });
});

describe("parseImageDrop", () => {
  it("returns a dropped image file", () => {
    const f = file("hero.png", "image/png");
    expect(parseImageDrop(opts, transfer({ files: [f] }))).toEqual({
      kind: "file",
      file: f,
    });
  });

  it("rejects a dropped non-image file", () => {
    expect(
      parseImageDrop(
        opts,
        transfer({ files: [file("notes.txt", "text/plain")] }),
      ),
    ).toEqual({ kind: "rejected", reason: "notes.txt is not an image" });
  });

  it("accepts an image file with no MIME type but an image extension", () => {
    const f = file("hero.webp", "");
    expect(parseImageDrop(opts, transfer({ files: [f] }))).toEqual({
      kind: "file",
      file: f,
    });
  });

  it("uses the first file only", () => {
    const first = file("a.png", "image/png");
    expect(
      parseImageDrop(
        opts,
        transfer({ files: [first, file("b.txt", "text/plain")] }),
      ),
    ).toEqual({ kind: "file", file: first });
  });

  it("reads a FilePicker tile drag", () => {
    expect(
      parseImageDrop(
        opts,
        transfer({ data: { "text/plain": tilePayload("worlds/w/a.jpg") } }),
      ),
    ).toEqual({ kind: "path", src: "worlds/w/a.jpg" });
  });

  it("reads the first URL of a uri-list, skipping comments", () => {
    expect(
      parseImageDrop(
        opts,
        transfer({
          data: {
            "text/uri-list":
              "# dragged\r\nhttps://example.com/a.png\r\nhttps://example.com/b.png",
          },
        }),
      ),
    ).toEqual({ kind: "path", src: "https://example.com/a.png" });
  });

  it("prefers a uri-list over text/plain", () => {
    expect(
      parseImageDrop(
        opts,
        transfer({
          data: {
            "text/plain": "other.png",
            "text/uri-list": "https://example.com/a.png",
          },
        }),
      ),
    ).toEqual({ kind: "path", src: "https://example.com/a.png" });
  });

  it("rejects a uri-list that is not an image", () => {
    expect(
      parseImageDrop(
        opts,
        transfer({ data: { "text/uri-list": "https://example.com/page" } }),
      ),
    ).toEqual({ kind: "rejected", reason: "That link is not an image" });
  });

  it("is null for a drag carrying nothing image-shaped", () => {
    expect(
      parseImageDrop(
        opts,
        transfer({
          data: { "text/plain": JSON.stringify({ type: "Item", uuid: "x" }) },
        }),
      ),
    ).toBeNull();
    expect(parseImageDrop(opts, transfer({}))).toBeNull();
  });
  it("reads the uri-list instead of the file when files are not preferred", () => {
    expect(
      parseImageDrop(
        { ...opts, preferFile: false },
        transfer({
          files: [file("a.png", "image/png")],
          data: { "text/uri-list": "https://example.com/a.png" },
        }),
      ),
    ).toEqual({ kind: "path", src: "https://example.com/a.png" });
  });

  it("still returns the file when files are not preferred but no path exists", () => {
    const f = file("a.png", "image/png");
    expect(
      parseImageDrop({ ...opts, preferFile: false }, transfer({ files: [f] })),
    ).toEqual({ kind: "file", file: f });
  });

  it("makes a same-origin URL relative to the server root", () => {
    expect(
      parseImageDrop(
        opts,
        transfer({
          data: {
            "text/uri-list": "http://localhost:30000/worlds/w/My%20Hero.png",
          },
        }),
      ),
    ).toEqual({ kind: "path", src: "worlds/w/My%20Hero.png" });
  });

  it("keeps a cross-origin URL absolute", () => {
    expect(
      parseImageDrop(
        opts,
        transfer({
          data: { "text/uri-list": "http://localhost:30001/worlds/w/a.png" },
        }),
      ),
    ).toEqual({ kind: "path", src: "http://localhost:30001/worlds/w/a.png" });
  });

  it("strips the route prefix from a same-origin URL", () => {
    expect(
      parseImageDrop(
        { ...opts, routePrefix: "foundry" },
        transfer({
          data: {
            "text/uri-list": "http://localhost:30000/foundry/worlds/w/a.png",
          },
        }),
      ),
    ).toEqual({ kind: "path", src: "worlds/w/a.png" });
  });

  it("accepts a route prefix written with slashes", () => {
    expect(
      parseImageDrop(
        { ...opts, routePrefix: "/foundry/" },
        transfer({
          data: {
            "text/uri-list": "http://localhost:30000/foundry/worlds/w/a.png",
          },
        }),
      ),
    ).toEqual({ kind: "path", src: "worlds/w/a.png" });
  });

  it("leaves the path unchanged with an empty route prefix", () => {
    expect(
      parseImageDrop(
        { ...opts, routePrefix: "" },
        transfer({
          data: { "text/uri-list": "http://localhost:30000/worlds/w/a.png" },
        }),
      ),
    ).toEqual({ kind: "path", src: "worlds/w/a.png" });
  });

  it.each([
    "http://localhost:30000/other/worlds/w/a.png",
    "http://localhost:30000/foundryx/worlds/w/a.png",
  ])("leaves %s as-is when it is outside the route prefix", (uri) => {
    expect(
      parseImageDrop(
        { ...opts, routePrefix: "foundry" },
        transfer({ data: { "text/uri-list": uri } }),
      ),
    ).toEqual({ kind: "path", src: uri });
  });
});
