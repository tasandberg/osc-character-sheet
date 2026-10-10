// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { parseAlignmentPage } from "./alignmentPage";

describe("parseAlignmentPage", () => {
  it("reads each alignment's paragraph from the rules page", () => {
    expect(
      parseAlignmentPage(
        "<p>All beings adhere to one of three alignments.</p><p><strong>Law:</strong> Lawful beings believe in truth.</p><p><strong>Neutrality:</strong> Neutral beings seek balance.</p><p><strong>Chaos:</strong> Chaotic beings oppose Law.</p>",
      ),
    ).toEqual({
      lawful: "Lawful beings believe in truth.",
      neutral: "Neutral beings seek balance.",
      chaotic: "Chaotic beings oppose Law.",
    });
  });
});
