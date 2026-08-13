import { describe, it, expect } from "vitest";
import path from "node:path";
import { compile } from "sass-embedded";
import postcss from "postcss";

// Foundry collapses a window with inline max-width/max-height, which any min-size wins over.
const COLLAPSE_STATES = ["minimizing", "minimized", "maximizing"];

const css = compile(
  path.resolve(__dirname, "styles.scss"),
  { loadPaths: [path.resolve(__dirname, "../../../node_modules")] },
).css;

const splitSelectorList = (selector: string) => {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of selector) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
};

// Subject compound only, so `.osc-sheet .thing` and `.osc-sheet-app` don't count.
const targetsFrame = (selector: string) => {
  const compounds = selector
    .replace(/\([^()]*\)/g, "")
    .split(/[\s>+~]+/)
    .filter(Boolean);
  return /\.osc-sheet(?![\w-])/.test(compounds.at(-1) ?? "");
};

const frameSelectors = (selector: string) =>
  splitSelectorList(selector).filter(targetsFrame);

describe("window frame sizing", () => {
  it("never applies a min size while Foundry is collapsing the window", () => {
    const offenders: string[] = [];

    postcss.parse(css).walkRules((rule) => {
      const declares = rule.nodes.some(
        (node) =>
          node.type === "decl" &&
          (node.prop === "min-width" || node.prop === "min-height"),
      );
      if (!declares) return;

      for (const selector of frameSelectors(rule.selector)) {
        const guarded = COLLAPSE_STATES.every((state) =>
          new RegExp(`:not\\([^)]*\\.${state}\\b[^)]*\\)`).test(selector),
        );
        if (!guarded) offenders.push(selector);
      }
    });

    expect(offenders).toEqual([]);
  });
});
