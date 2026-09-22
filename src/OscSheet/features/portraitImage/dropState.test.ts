import { describe, it, expect } from "vitest";
import {
  resolvePortraitDropState,
  type PortraitDropGateInputs,
  type PortraitDropState,
} from "@features/portraitImage/dropState";

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
  it.each([
    ["ready when enabled, configured and permitted", {}, { ready: true }],
    ["ready for a GM", { isGM: true }, { ready: true }],
    [
      "blocked for a player while uploads are off",
      { uploadsEnabled: false },
      { ready: false, message: NOT_ENABLED },
    ],
    [
      "blocked for a GM while uploads are off",
      { isGM: true, uploadsEnabled: false },
      { ready: false, message: NOT_ENABLED },
    ],
    [
      "disabled before any other problem",
      { canUpload: false, uploadsEnabled: false, uploadPath: "" },
      { ready: false, message: NOT_ENABLED },
    ],
    [
      "a request that the GM set the blank path",
      { isGM: true, uploadPath: "" },
      { ready: false, message: GM_SET_PATH },
    ],
    [
      "a nudge for a player to ask their GM about the blank path",
      { uploadPath: "" },
      { ready: false, message: ASK_GM },
    ],
    [
      "blank for a whitespace-only path",
      { isGM: true, uploadPath: "   " },
      { ready: false, message: GM_SET_PATH },
    ],
    [
      "blocked without upload permission",
      { canUpload: false },
      { ready: false, message: ASK_GM },
    ],
    [
      "the blank-path message for a GM lacking permission",
      { isGM: true, canUpload: false, uploadPath: "" },
      { ready: false, message: GM_SET_PATH },
    ],
  ] as [string, Partial<PortraitDropGateInputs>, PortraitDropState][])(
    "is %s",
    (_, overrides, expected) => {
      expect(resolvePortraitDropState({ ...base, ...overrides })).toEqual(
        expected,
      );
    },
  );
});
