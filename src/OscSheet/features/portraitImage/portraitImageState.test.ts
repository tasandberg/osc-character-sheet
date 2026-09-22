import { describe, it, expect } from "vitest";
import {
  dirtyPortraitImageKeys,
  initialPortraitImageState,
  linkPortraitImage,
  setPortraitImageSlot,
  type ActorImages,
  type ImageSlot,
  type PortraitImageDrop,
  type PortraitImageTarget,
} from "@features/portraitImage/portraitImageState";

const file = new File(["x"], "hero.png", { type: "image/png" });
const image: ImageSlot = { kind: "file", file };
const drop = (target: PortraitImageTarget): PortraitImageDrop => ({
  image,
  target,
});

const same: ActorImages = { portrait: "a.png", token: "a.png" };
const differ: ActorImages = { portrait: "a.png", token: "b.png" };

describe("initialPortraitImageState", () => {
  it("stages nothing when opened from a click on matching images", () => {
    expect(initialPortraitImageState(same)).toEqual({
      portrait: { kind: "path", src: "a.png" },
      token: { kind: "path", src: "a.png" },
      linked: true,
      updatePlaced: false,
    });
  });

  it("starts unlinked when the actor's portrait and token differ", () => {
    expect(initialPortraitImageState(differ)).toEqual({
      portrait: { kind: "path", src: "a.png" },
      token: { kind: "path", src: "b.png" },
      linked: false,
      updatePlaced: false,
    });
  });

  it("stages a portrait drop into the portrait slot, unlinked", () => {
    expect(initialPortraitImageState(same, drop("portrait"))).toEqual({
      portrait: image,
      token: { kind: "path", src: "a.png" },
      linked: false,
      updatePlaced: false,
    });
  });

  it("stages a token drop into the token slot, unlinked", () => {
    expect(initialPortraitImageState(same, drop("token"))).toEqual({
      portrait: { kind: "path", src: "a.png" },
      token: image,
      linked: false,
      updatePlaced: false,
    });
  });

  it("stages a both drop into both slots and links them", () => {
    const state = initialPortraitImageState(differ, drop("both"));
    expect(state.linked).toBe(true);
    expect(state.portrait).toEqual(image);
    expect(state.token).toBe(state.portrait);
  });
});

describe("linkPortraitImage", () => {
  it("copies the portrait slot onto the token slot when checked", () => {
    const state = linkPortraitImage(initialPortraitImageState(differ), true);
    expect(state.linked).toBe(true);
    expect(state.token).toBe(state.portrait);
  });

  it("leaves both slots as they are when unchecked", () => {
    const linked = initialPortraitImageState(same, drop("both"));
    const state = linkPortraitImage(linked, false);
    expect(state.linked).toBe(false);
    expect(state.portrait).toBe(linked.portrait);
    expect(state.token).toBe(linked.token);
  });
});

describe("setPortraitImageSlot", () => {
  it("replaces one slot while unlinked", () => {
    const state = setPortraitImageSlot(
      initialPortraitImageState(differ),
      "token",
      { kind: "path", src: "c.png" },
    );
    expect(state.token).toEqual({ kind: "path", src: "c.png" });
    expect(state.portrait).toEqual({ kind: "path", src: "a.png" });
  });

  it("replaces both slots while linked", () => {
    const state = setPortraitImageSlot(
      initialPortraitImageState(same),
      "portrait",
      image,
    );
    expect(state.portrait).toEqual(image);
    expect(state.token).toBe(state.portrait);
  });
});

describe("dirtyPortraitImageKeys", () => {
  it("finds nothing dirty for the actor's own paths", () => {
    expect(
      dirtyPortraitImageKeys(initialPortraitImageState(differ), differ),
    ).toEqual({ portrait: false, token: false });
  });

  it("treats a staged file as dirty", () => {
    expect(
      dirtyPortraitImageKeys(
        initialPortraitImageState(same, drop("both")),
        same,
      ),
    ).toEqual({ portrait: true, token: true });
  });

  it("treats only the dropped slot as dirty for a token drop", () => {
    expect(
      dirtyPortraitImageKeys(
        initialPortraitImageState(same, drop("token")),
        same,
      ),
    ).toEqual({ portrait: false, token: true });
  });

  it("treats a linked token as dirty when it adopts the portrait path", () => {
    expect(
      dirtyPortraitImageKeys(
        linkPortraitImage(initialPortraitImageState(differ), true),
        differ,
      ),
    ).toEqual({ portrait: false, token: true });
  });

  it("treats a picked path as dirty only where it differs", () => {
    const state = setPortraitImageSlot(
      initialPortraitImageState(differ),
      "portrait",
      { kind: "path", src: "c.png" },
    );
    expect(dirtyPortraitImageKeys(state, differ)).toEqual({
      portrait: true,
      token: false,
    });
  });
});
