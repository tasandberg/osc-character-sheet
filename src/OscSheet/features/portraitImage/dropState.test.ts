import { describe, it, expect } from "vitest";
import { resolvePortraitDropState } from "@features/portraitImage/dropState";

const NOT_ENABLED = "Portrait uploads not enabled for this world";
const GM_SET_PATH = "Please set an upload target for OSC Sheet portraits";
const ASK_GM = "Ask your GM to set an upload target for OSC Sheet portraits";

const base = {
  isGM: false,
  canUpload: true,
  uploadsEnabled: true,
  uploadPath: "worlds/test/osc-portraits",
};

describe("resolvePortraitDropState", () => {
  it("is ready when enabled, configured and permitted", () => {
    expect(resolvePortraitDropState(base)).toEqual({ ready: true });
  });

  it("is ready for a GM when enabled and configured", () => {
    expect(resolvePortraitDropState({ ...base, isGM: true })).toEqual({
      ready: true,
    });
  });

  it("blocks when uploads are disabled, for GM and player alike", () => {
    expect(
      resolvePortraitDropState({ ...base, uploadsEnabled: false }),
    ).toEqual({ ready: false, message: NOT_ENABLED });
    expect(
      resolvePortraitDropState({ ...base, isGM: true, uploadsEnabled: false }),
    ).toEqual({ ready: false, message: NOT_ENABLED });
  });

  it("reports disabled before any other problem", () => {
    expect(
      resolvePortraitDropState({
        isGM: false,
        canUpload: false,
        uploadsEnabled: false,
        uploadPath: "",
      }),
    ).toEqual({ ready: false, message: NOT_ENABLED });
  });

  it("asks a GM to set the path when it is blank", () => {
    expect(
      resolvePortraitDropState({ ...base, isGM: true, uploadPath: "" }),
    ).toEqual({ ready: false, message: GM_SET_PATH });
  });

  it("tells a player to ask their GM when the path is blank", () => {
    expect(resolvePortraitDropState({ ...base, uploadPath: "" })).toEqual({
      ready: false,
      message: ASK_GM,
    });
  });

  it("treats a whitespace-only path as blank", () => {
    expect(
      resolvePortraitDropState({ ...base, isGM: true, uploadPath: "   " }),
    ).toEqual({ ready: false, message: GM_SET_PATH });
  });

  it("blocks a user without upload permission", () => {
    expect(resolvePortraitDropState({ ...base, canUpload: false })).toEqual({
      ready: false,
      message: ASK_GM,
    });
  });

  it("prefers the blank-path message for a GM lacking permission", () => {
    expect(
      resolvePortraitDropState({
        ...base,
        isGM: true,
        canUpload: false,
        uploadPath: "",
      }),
    ).toEqual({ ready: false, message: GM_SET_PATH });
  });
});
