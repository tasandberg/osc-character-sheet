// Deterministic Vellum CSS build for design-sync.
// Mirrors the app/Storybook pipeline: scope tokens.css + components.css with the
// same postcss scoper the app uses, compile styles.scss (already
// .reactor-sheet-scoped in source) with dart-sass.
//
// Exposes buildParts() so the generator can split the two shipped artifacts:
//   _ds_bundle.css = tokens + utilities + components (the scoped Vellum bundle)
//   styles.css     = the scoped app styles.scss compile
// Run directly (cfg.buildCmd) it still concatenates all four →
// .design-sync/.cache/vellum-bundle.css (cfg.cssEntry points here).
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import postcss from "postcss";
import { scopeVellum } from "../tools/postcss/scope-vellum.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vellum = path.join(root, "src/ReactorSheet/styles/vellum");
const stylesDir = path.join(root, "src/ReactorSheet/styles");

async function scopeCss(css, from) {
  // postcss-prefix-selector keys off the `from` path (must contain /styles/vellum/).
  const res = await postcss([scopeVellum]).process(css, { from });
  return res.css;
}
const scope = (file) => scopeCss(readFileSync(file, "utf8"), file);
// utilities.scss is generated (token maps → @each); compile with dart-sass first,
// then scope through the same postcss prefixer (from-path stays under vellum/).
function sass(file, extraArgs = []) {
  return execFileSync(
    path.join(root, "node_modules/.bin/sass"),
    ["--no-source-map", ...extraArgs, file],
    { encoding: "utf8" },
  );
}

export async function buildParts() {
  const tokens = await scope(path.join(vellum, "tokens.css"));
  const utilitiesScss = path.join(vellum, "utilities.scss");
  const utilities = await scopeCss(sass(utilitiesScss), utilitiesScss);
  const components = await scope(path.join(vellum, "components.css"));
  const styles = sass(path.join(stylesDir, "styles.scss"), [`--load-path=${stylesDir}`]);
  return { tokens, utilities, components, styles };
}

// CLI: keep back-compat — concatenate everything into the cached bundle.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { tokens, utilities, components, styles } = await buildParts();
  const outDir = path.join(root, ".design-sync/.cache");
  mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, "vellum-bundle.css");
  const bundle = [tokens, utilities, components, styles].join("\n");
  writeFileSync(out, bundle);
  console.log(`wrote ${path.relative(root, out)} (${(Buffer.byteLength(bundle) / 1024).toFixed(0)} KB)`);
}
