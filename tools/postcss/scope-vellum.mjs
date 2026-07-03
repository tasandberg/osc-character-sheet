import prefixer from "postcss-prefix-selector";

const ROOT = ".osc-sheet";

// One global PostCSS plugin (Vite resolves postcss config once, not per file),
// so it self-filters by filePath — only files under styles/vellum/ are scoped.
// postcss-prefix-selector passes filePath as the 4th transform arg.
export const scopeVellum = prefixer({
  prefix: ROOT,
  transform(prefix, selector, prefixedSelector, filePath) {
    if (!filePath || !filePath.includes("/styles/vellum/")) {
      return selector; // not a Vellum file — leave untouched
    }
    if (selector === ":root" || selector === "html" || selector === "body") {
      return prefix;
    }
    if (selector.startsWith("[data-theme")) {
      // e.g. [data-theme="cream"] → .osc-sheet[data-theme="cream"]
      return `${prefix}${selector}`;
    }
    return prefixedSelector;
  },
});
