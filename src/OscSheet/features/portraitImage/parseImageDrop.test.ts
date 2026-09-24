import { describe, it, expect } from "vitest";
import { parseImageDrop } from "@features/portraitImage/parseImageDrop";
import { tile, type Transfer } from "./__fixtures__/dragWorld";

const ORIGIN = "http://localhost:30000";
const png = new File(["x"], "a.png", { type: "image/png" });
const untyped = new File(["x"], "a.webp");
const text = new File(["x"], "notes.txt", { type: "text/plain" });
const uri = (list: string): Transfer => ({ data: { "text/uri-list": list } });
const plain = (payload: string): Transfer => ({
  data: { "text/plain": payload },
});

const parse = (
  { files = [], data = {} }: Transfer,
  opts: { preferFile?: boolean; routePrefix?: string } = {},
) =>
  parseImageDrop(
    { preferFile: true, origin: ORIGIN, ...opts },
    { files, types: [], getData: (t) => data[t] ?? "" },
  );

describe("parseImageDrop", () => {
  it.each([
    ["an image file", { files: [png] }, { kind: "file", file: png }],
    [
      "an untyped file with an image extension",
      { files: [untyped] },
      { kind: "file", file: untyped },
    ],
    [
      "a FilePicker tile",
      plain(tile("worlds/w/a.jpg")),
      { kind: "path", src: "worlds/w/a.jpg" },
    ],
    [
      "a raw image path",
      plain(" icons/svg/mystery-man.svg\n"),
      { kind: "path", src: "icons/svg/mystery-man.svg" },
    ],
    [
      "the first link of a uri-list",
      uri("# c\r\nhttps://x.com/a.png\r\nhttps://x.com/b.png"),
      { kind: "path", src: "https://x.com/a.png" },
    ],
    [
      "a uri-list over text",
      {
        data: { "text/plain": "b.png", "text/uri-list": "https://x.com/a.png" },
      },
      { kind: "path", src: "https://x.com/a.png" },
    ],
  ] as [string, Transfer, unknown][])("accepts %s", (_, transfer, expected) => {
    expect(parse(transfer)).toEqual(expected);
  });

  it.each([
    [
      "a non-image file",
      { files: [text] },
      { kind: "rejected", reason: "notes.txt is not an image" },
    ],
    [
      "a link to a non-image",
      uri("https://x.com/page"),
      { kind: "rejected", reason: "That link is not an image" },
    ],
    [
      "a tile whose texture is not an image",
      plain(tile("sounds/boom.ogg")),
      null,
    ],
    [
      "a document drag",
      plain(JSON.stringify({ type: "Item", uuid: "x" })),
      null,
    ],
    ["an empty drag", {}, null],
  ] as [string, Transfer, unknown][])("rejects %s", (_, transfer, expected) => {
    expect(parse(transfer)).toEqual(expected);
  });

  it("takes the link over the file when uploads are unavailable, else the file", () => {
    const both = { files: [png], ...uri("https://x.com/a.png") };
    expect(parse(both, { preferFile: false })).toEqual({
      kind: "path",
      src: "https://x.com/a.png",
    });
    expect(parse({ files: [png] }, { preferFile: false })).toEqual({
      kind: "file",
      file: png,
    });
  });

  it.each([
    [`${ORIGIN}/worlds/w/My%20Hero.png`, undefined, "worlds/w/My%20Hero.png"],
    [
      "http://localhost:30001/worlds/w/a.png",
      undefined,
      "http://localhost:30001/worlds/w/a.png",
    ],
    [`${ORIGIN}/foundry/worlds/w/a.png`, "/foundry/", "worlds/w/a.png"],
    [
      `${ORIGIN}/foundryx/worlds/w/a.png`,
      "foundry",
      `${ORIGIN}/foundryx/worlds/w/a.png`,
    ],
  ])("resolves %s under route prefix %s to %s", (link, routePrefix, src) => {
    expect(parse(uri(link), { routePrefix })).toEqual({ kind: "path", src });
  });
});
