import { describe, it, expect } from "vitest";
import { allowedScoreMethods } from "./scoresDraft";

describe("allowedScoreMethods", () => {
  it("lists the enabled methods in order, or all of them when none is enabled", () => {
    expect(
      allowedScoreMethods({ inOrder: false, arrange: true, manual: true }),
    ).toEqual(["arrange", "manual"]);
    expect(
      allowedScoreMethods({ inOrder: false, arrange: false, manual: false }),
    ).toEqual(["inOrder", "arrange", "manual"]);
  });
});
