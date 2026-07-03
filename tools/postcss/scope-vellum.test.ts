import { describe, it, expect } from "vitest";
import postcss from "postcss";
import { scopeVellum } from "./scope-vellum.mjs";

// Simulate a file under styles/vellum/ (the plugin self-filters by path).
const VELLUM = "/proj/src/OscSheet/styles/vellum/tokens.css";
const run = (css: string, from = VELLUM) =>
  postcss([scopeVellum]).process(css, { from }).css.replace(/\s+/g, " ").trim();

describe("scopeVellum", () => {
  it("rescopes :root to the sheet root", () => {
    expect(run(":root { --bg: #181612; }")).toBe(".osc-sheet { --bg: #181612; }");
  });

  it("rescopes the cream theme attribute onto the sheet root", () => {
    expect(run('[data-theme="cream"] { --bg: #efe9d8; }')).toBe(
      '.osc-sheet[data-theme="cream"] { --bg: #efe9d8; }'
    );
  });

  it("collapses html/body onto the sheet root", () => {
    expect(run("body { margin: 0; }")).toBe(".osc-sheet { margin: 0; }");
  });

  it("prefixes ordinary component selectors", () => {
    expect(run(".btn { color: red; }")).toBe(".osc-sheet .btn { color: red; }");
  });

  it("prefixes each selector in a list", () => {
    expect(run(".btn, .tab { color: red; }")).toBe(
      ".osc-sheet .btn, .osc-sheet .tab { color: red; }"
    );
  });

  it("leaves non-Vellum files untouched", () => {
    const css = ".btn { color: red; }";
    expect(run(css, "/proj/src/OscSheet/styles/styles.scss")).toBe(css);
  });
});
