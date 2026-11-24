import { describe, it, expect } from "vitest";
import {
  ARRANGE,
  IN_ORDER,
  allowedScoreMethods,
  chooseScoreMethod,
  emptyScoresDraft,
  resolveCustomScoreMethods,
} from "./scoresDraft";

describe("allowedScoreMethods", () => {
  const heroic = {
    id: "a1",
    label: "Heroic",
    formula: "4d6dl",
    arrange: true,
    enabled: true,
  };

  it("lists the enabled roll methods, custom ones included, then manual entry", () => {
    expect(
      allowedScoreMethods({ inOrder: false, arrange: true, manual: true }, [
        heroic,
      ]),
    ).toEqual([ARRANGE, heroic, "manual"]);
  });

  it("leaves out a disabled custom method", () => {
    expect(
      allowedScoreMethods({ inOrder: false, arrange: true, manual: false }, [
        { ...heroic, enabled: false },
      ]),
    ).toEqual([ARRANGE]);
  });

  it("offers 3d6 down the line when nothing is enabled", () => {
    expect(
      allowedScoreMethods({ inOrder: false, arrange: false, manual: false }, [
        { ...heroic, enabled: false },
      ]),
    ).toEqual([IN_ORDER]);
  });
});

describe("chooseScoreMethod", () => {
  const rolled = {
    ...emptyScoresDraft(IN_ORDER),
    inOrder: { str: { total: 12, dice: [4, 4, 4] } },
  };
  const heroic = {
    id: "a1",
    label: "Heroic",
    formula: "4d6dl",
    arrange: false,
    enabled: true,
  };

  it("keeps rolled dice while the formula stays the same", () => {
    const viaManual = chooseScoreMethod(
      chooseScoreMethod(rolled, "manual"),
      ARRANGE,
    );
    expect(viaManual.inOrder).toEqual(rolled.inOrder);
  });

  it("clears rolled dice when the formula changes, even by way of manual entry", () => {
    const viaManual = chooseScoreMethod(
      chooseScoreMethod(rolled, "manual"),
      heroic,
    );
    expect(viaManual.inOrder).toEqual({});
  });
});

describe("resolveCustomScoreMethods", () => {
  it("keeps only well-formed methods, enabled unless saved otherwise", () => {
    expect(
      resolveCustomScoreMethods([
        null,
        "4d6dl",
        { id: "a1", label: " ", formula: "4d6dl" },
        { id: "a2", label: "Heroic", formula: "4d6dl", arrange: "yes" },
        { id: "a3", label: "Gritty", formula: "2d6+6", enabled: false },
      ]),
    ).toEqual([
      {
        id: "a2",
        label: "Heroic",
        formula: "4d6dl",
        arrange: false,
        enabled: true,
      },
      {
        id: "a3",
        label: "Gritty",
        formula: "2d6+6",
        arrange: false,
        enabled: false,
      },
    ]);
    expect(resolveCustomScoreMethods("not a list")).toEqual([]);
  });
});
