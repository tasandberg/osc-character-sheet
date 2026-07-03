// Deterministic Vellum CSS build for design-sync.
// Mirrors the app/Storybook pipeline: scope tokens.css + components.css with the
// same postcss scoper the app uses, compile styles.scss (already
// .reactor-sheet-scoped in source) with dart-sass, concatenate.
// Output → .design-sync/.cache/vellum-bundle.css (cfg.cssEntry points here).
// Fonts ship separately via cfg.extraFonts (fonts.css).
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import postcss from "postcss";
import { scopeVellum } from "../tools/postcss/scope-vellum.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vellum = path.join(root, "src/ReactorSheet/styles/vellum");
const stylesDir = path.join(root, "src/ReactorSheet/styles");

async function scope(file) {
  const css = readFileSync(file, "utf8");
  // postcss-prefix-selector keys off the `from` path (must contain /styles/vellum/).
  const res = await postcss([scopeVellum]).process(css, { from: file });
  return res.css;
}

const tokens = await scope(path.join(vellum, "tokens.css"));
const components = await scope(path.join(vellum, "components.css"));
const scss = execFileSync(
  path.join(root, "node_modules/.bin/sass"),
  ["--no-source-map", `--load-path=${stylesDir}`, path.join(stylesDir, "styles.scss")],
  { encoding: "utf8" },
);

const outDir = path.join(root, ".design-sync/.cache");
mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, "vellum-bundle.css");
writeFileSync(out, [tokens, components, scss].join("\n"));
console.log(`wrote ${path.relative(root, out)} (${(Buffer.byteLength([tokens, components, scss].join("\n")) / 1024).toFixed(0)} KB)`);
