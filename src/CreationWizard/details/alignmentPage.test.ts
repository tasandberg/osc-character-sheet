// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from "vitest";
import { parseAlignmentPage } from "./alignmentPage";
import { foundryAlignmentText } from "./foundryDetails";

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

describe("foundryAlignmentText", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("finds the Alignment page whatever its journal entry is called", async () => {
    const entries: Record<string, { name: string; content: string }[]> = {
      intro: [{ name: "Introduction", content: "<p>Welcome.</p>" }],
      characters: [
        { name: "Classes", content: "<p>Fighter.</p>" },
        {
          name: "Alignment",
          content:
            "<p><strong>Law:</strong> Lawful beings believe in truth.</p>",
        },
      ],
    };
    vi.stubGlobal("game", {
      modules: { get: () => undefined },
      packs: {
        get: (id: string) =>
          id === "classicfantasycompendium.classic-fantasy-srd"
            ? {
                getIndex: async () => [
                  { _id: "intro", name: "Chapter 1: Introduction" },
                  { _id: "characters", name: "Chapter 2: Characters" },
                ],
                getDocument: async (id: string) => ({
                  pages: {
                    contents: entries[id].map(({ name, content }) => ({
                      name,
                      text: { content },
                    })),
                  },
                }),
              }
            : undefined,
      },
    });

    expect(await foundryAlignmentText()()).toEqual({
      lawful: "Lawful beings believe in truth.",
    });
  });
});
