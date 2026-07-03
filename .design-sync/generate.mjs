// Design-sync bundle generator (reconstructed; replaces the lost CLI tooling).
// Emits the Claude Design remote layout for the Vellum ui/ library into
// .design-sync/.stage/, mirroring remote paths. Format matched to fetched
// exemplars (Tag.html/.jsx/.d.ts/.prompt.md, _preview/Tag.js, _ds_manifest.json,
// _ds_sync.json). See .design-sync/NOTES.md for the pipeline background.
//
//   node .design-sync/generate.mjs
//
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import postcss from "postcss";
import { buildParts } from "./build-css.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// esbuild is a transitive (pnpm) dep — import its resolved main.js by abs path (CJS).
const esbuildMod = await import(
  path.join(ROOT, "node_modules/.pnpm/esbuild@0.27.7/node_modules/esbuild/lib/main.js")
);
const esbuild = esbuildMod.default ?? esbuildMod;
const DS = path.join(ROOT, ".design-sync");
const STAGE = path.join(DS, ".stage");
const UIDIR = path.join(ROOT, "src/ReactorSheet/components/ui");
// Preview cards are sourced from each component's *.stories.tsx (single source of
// truth; the old .design-sync/previews mirror is gone). KvCard has its own story.
const storyPath = (name) => path.join(UIDIR, `${name}.stories.tsx`);

const cfg = JSON.parse(readFileSync(path.join(DS, "config.json"), "utf8"));
const pkgVersion = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8")).version;

// ── Group taxonomy (lowercase path group). @category is authoritative; the four
//    components without one fall back to their *.stories.tsx title group. ──
const GROUP = {
  Button: "controls", IconButton: "controls", InlineButton: "controls", Field: "controls",
  Textarea: "controls", Select: "controls", Stepper: "controls", Toggle: "controls",
  Check: "controls", Radio: "controls", Segmented: "controls",
  Stamp: "display", Tag: "display", ProgressBar: "display", Die: "display",
  Monogram: "display", StampCell: "display", Pips: "display", StatPlaque: "display",
  Card: "layout", KvCard: "layout", SectionTitle: "layout", SectionHeader: "layout",
  PortraitField: "layout",
  Modal: "overlays", ConfirmDialog: "overlays", Toast: "overlays", Menu: "overlays",
  Empty: "overlays", Skeleton: "overlays",
  Tabs: "navigation",
  Table: "data",
};
const GROUP_LABEL = {
  controls: "Controls", display: "Display", layout: "Layout",
  overlays: "Overlays", navigation: "Navigation", data: "Data",
};
// Cards rendered at a wider viewport (matches remote: multi-cell / overlay cards).
const WIDE = new Set(["SectionTitle", "Menu", "Modal", "ConfirmDialog"]);

// dtsPropsFor for the 8 Wave-2 components (config.json only carries the original 24).
const NEW_PROPS = {
  ConfirmDialog:
    'open: boolean;\n  title: React.ReactNode;\n  body: React.ReactNode;\n  confirmLabel?: string;\n  cancelLabel?: string;\n  variant?: "primary" | "danger";\n  onConfirm: () => void;\n  onCancel: () => void;',
  InlineButton:
    "/** transparent inline action button — supply icon and/or text as children */\n  children?: React.ReactNode;\n  className?: string;\n  /** plus native <button> attributes (onClick, disabled, type, …) */\n  [key: string]: unknown;",
  Monogram:
    'img?: string | null;\n  monogram: string;\n  className: string;\n  imgClassName?: string;\n  draggable?: boolean;\n  onDragStart?: React.DragEventHandler<HTMLElement>;\n  "data-testid"?: string;',
  Pips:
    '/** dot-meter: `total` dots, first `filled` marked filled */\n  total: number;\n  filled: number;\n  /** dot size — default (md, 16px) or "sm" (9px) */\n  size?: "sm";\n  /** bordered ring style that holds `glyph`; default = solid disc */\n  hollow?: boolean;\n  className?: string;\n  /** rendered inside FILLED dots only (hollow variant) */\n  glyph?: React.ReactNode;\n  /** plus native <span> attributes */\n  [key: string]: unknown;',
  PortraitField:
    "src?: string;\n  onPick: (path: string) => void;\n  placeholder?: string;\n  className?: string;",
  SectionHeader:
    "title: string;\n  controls?: React.ReactNode;",
  StampCell:
    "stampKey: string;\n  fullName?: string;\n  value: number;\n  onChange: (n: number) => void;\n  min: number;\n  max: number;\n  caption: React.ReactNode;\n  overridden?: boolean;\n  /** flags the cell (crimson) — e.g. a score below the class requirement */\n  warn?: boolean;\n  warnTitle?: string;\n  onResetRequest?: () => void;",
  StatPlaque:
    'variant: "ability" | "save";\n  stampKey: React.ReactNode;\n  value: React.ReactNode;\n  caption?: React.ReactNode;\n  onActivate?: () => void;\n  className?: string;\n  title?: string;\n  "data-testid"?: string;',
};
const propsFor = (name) => cfg.dtsPropsFor[name] ?? NEW_PROPS[name] ?? "children?: React.ReactNode;\n  [key: string]: unknown;";

const sha = (buf) => createHash("sha256").update(buf).digest("hex");

// ── per-component text templates (byte-matched to exemplars) ──────────────────
function htmlFor(name, group) {
  const mode = cfg.overrides?.[name]?.cardMode ?? "grid";
  const primary = cfg.overrides?.[name]?.primaryStory ?? "";
  return `<!-- @dsCard group="${group}" -->
<!doctype html>
<html><head><meta charset="utf-8">
  <link rel="stylesheet" href="../../../styles.css">
  <link rel="stylesheet" href="../../../_ds_bundle.css">
  <style>
    body{margin:0;padding:24px;background:#fff}
    /* auto-fit (not auto-fill): empty tracks collapse, so a 1-2 story card
       fills the width instead of stranding stories in a half-width left
       column beside phantom empty columns */
    .ds-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px;align-items:start}
    .ds-grid.ds-col{grid-template-columns:1fr}
    .ds-cell{border:1px solid #e5e7eb;border-radius:8px;padding:12px;min-width:0;overflow:hidden;transform:translateZ(0)}
    .ds-cell>h4{margin:0 0 8px;font:600 12px system-ui;color:#6b7280;text-transform:uppercase;letter-spacing:.04em}
    .ds-single{transform:translateZ(0)}
  </style>
</head><body>
  <div class="ds-grid" id="g"></div>
  <script src="../../../_vendor/react.js"></script>
  <script src="../../../_vendor/react-dom.js"></script>
  <script src="../../../_ds_bundle.js"></script>
  <script src="../../../_preview/${name}.js"></script>
  <script>
    var h=React.createElement, g=document.getElementById('g');
    var E=[]; for (var k in (window.__dsPreview||{})) {
      if (typeof window.__dsPreview[k]==='function' && /^[A-Z]/.test(k)) E.push(k);
    }
    window.__dsCells=E.slice();
    var q=null; try{q=new URLSearchParams(location.search).get('story')}catch(e){}
    var MODE="${mode}";
    window.__dsMode=MODE;
    var PRIMARY="${primary}";
    if(MODE==='column'){
      g.className+=' ds-col';
      // primaryStory renders first — it's what shows above the product's fold.
      var cpi=PRIMARY?E.indexOf(PRIMARY):-1;
      if(cpi>0){E.splice(cpi,1);E.unshift(PRIMARY)}
    }
    function mount(id,key){try{ReactDOM.createRoot(document.getElementById(id)).render(h(window.ReactorSheet.VellumRoot,{},h(window.__dsPreview[key])))}catch(e){document.getElementById(id).textContent='⚠ '+(e&&e.message||e)}}
    var pick=null;
    if(q){for(var j=0;j<E.length;j++){if(E[j]===q||E[j].toLowerCase()===q.toLowerCase()){pick=E[j];break}}}
    else if(MODE==='single'&&E.length){pick=E.indexOf(PRIMARY)>=0?PRIMARY:E[0]}
    if(q&&!pick){g.textContent='⚠ no export named '+q}
    else if(pick){
      var s=document.createElement('div'); s.className='ds-single'; s.id='r0';
      // The PRODUCT's default single render is full-bleed: a full-viewport
      // story root (100vh / Grommet full) plus body padding guarantees a
      // permanent 48px whitespace scrollbar in the card otherwise. Gated on
      // !q so ?story= captures keep the padding gutter — the graded framing
      // (and its edge-shadow room vs the storybook reference) stays
      // byte-identical to what every existing verdict was minted on.
      if(!q)document.body.style.padding='0';
      g.parentNode.replaceChild(s,g); mount('r0',pick);
    } else {
      for(var i=0;i<E.length;i++){
        var cell=document.createElement('section'); cell.className='ds-cell';
        cell.innerHTML='<h4>'+E[i]+'</h4><div id="r'+i+'"></div>'; g.appendChild(cell);
        mount('r'+i,E[i]);
      }
      if(E.length===0){g.textContent='⚠ no PascalCase exports in _preview/${name}.js'}
    }
  </script>
</body></html>`;
}

const jsxFor = (name) =>
  `// Re-export of reactor-sheet@${pkgVersion} ${name}. Implementation is in the root _ds_bundle.js (window.ReactorSheet).\nObject.assign(window, { ${name}: window.ReactorSheet.${name} });\n`;

const dtsFor = (name) =>
  `import * as React from 'react';\n\n/**\n * ${name} — from reactor-sheet@${pkgVersion}.\n */\nexport interface ${name}Props {\n${propsFor(name)}\n}\n\nexport declare const ${name}: React.ComponentType<${name}Props>;\n`;

// Extract `export const <Name> = <init>;` blocks (source order) from a preview.
function extractExports(src) {
  const out = [];
  const re = /export\s+const\s+([A-Za-z0-9_]+)\s*=\s*/g;
  let m;
  while ((m = re.exec(src))) {
    const name = m[1];
    let i = re.lastIndex;
    let depth = 0, str = null, init = "";
    for (; i < src.length; i++) {
      const c = src[i], p = src[i - 1];
      if (str) {
        init += c;
        if (c === str && p !== "\\") str = null;
        else if (str === "`" && c === "{" && p === "$") depth++; // template expr
        continue;
      }
      if (c === '"' || c === "'" || c === "`") { str = c; init += c; continue; }
      if (c === "(" || c === "{" || c === "[") depth++;
      else if (c === ")" || c === "}" || c === "]") depth--;
      else if (c === ";" && depth === 0) break;
      init += c;
    }
    out.push({ name, init: init.trim() });
  }
  return out;
}

function promptFor(name, group, exports) {
  const examples = exports
    .map((e) => `### ${e.name}\n\n\`\`\`jsx\n${e.init}\n\`\`\`\n`)
    .join("\n");
  return `${name} from reactor-sheet. Use via \`window.ReactorSheet.${name}\` (bundle loaded from the root \`_ds_bundle.js\`). Wrap the tree in \`<VellumRoot>\` (full provider chain in README.md — components read theme/i18n from that context).

@category ${GROUP_LABEL[group]}

## Props

\`\`\`ts
interface ${name}Props {
${propsFor(name)}
}
\`\`\`

## Examples

${examples}`;
}

// ── esbuild: shared shims (react → window.React, jsx → hand-rolled, ds → window.ReactorSheet) ──
const jsxShim = `
var R = window.React;
export var Fragment = R.Fragment;
export function jsx(type, props, key) {
  var p = props || {}, kids = p.children, rest = {};
  for (var k in p) if (k !== "children") rest[k] = p[k];
  if (key !== undefined) rest.key = key;
  if (Array.isArray(kids)) return R.createElement.apply(null, [type, rest].concat(kids));
  if (kids !== undefined) return R.createElement(type, rest, kids);
  return R.createElement(type, rest);
}
export var jsxs = jsx;
export function jsxDEV(type, props, key) { return jsx(type, props, key); }
`;
// react/react-dom → window globals; react-shim/jsx → hand-rolled createElement.
// When `shimUi`, relative imports that resolve under ui/ (a story pulling in its
// component) are mapped to window.ReactorSheet — matching the remote preview
// structure. The library-bundle build sets shimUi=false so it compiles the real
// ui/ source that DEFINES window.ReactorSheet.
const makeShims = (shimUi) => ({
  name: "ds-shims",
  setup(build) {
    const map = {
      react: "module.exports = window.React;",
      "react-dom": "module.exports = window.ReactDOM;",
      "react-dom/client": "module.exports = window.ReactDOM;",
      "reactor-sheet": "module.exports = window.ReactorSheet;",
      "ds-ui": "module.exports = window.ReactorSheet;",
    };
    build.onResolve({ filter: /^(react|react-dom|react-dom\/client|reactor-sheet)$/ }, (a) => ({
      path: a.path, namespace: "shim-cjs",
    }));
    build.onResolve({ filter: /^react-shim\/jsx(-dev)?-runtime$/ }, (a) => ({
      path: a.path, namespace: "shim-jsx",
    }));
    if (shimUi) {
      build.onResolve({ filter: /^\.\.?\// }, (a) => {
        const abs = path.resolve(a.resolveDir, a.path);
        const rel = path.relative(UIDIR, abs);
        if (rel.startsWith("..") || path.isAbsolute(rel)) return; // not under ui/
        if (/\.stories\b/.test(a.path)) return; // never shim another story
        return { path: "ds-ui", namespace: "shim-cjs" };
      });
    }
    build.onLoad({ filter: /.*/, namespace: "shim-cjs" }, (a) => ({
      contents: map[a.path], loader: "js",
    }));
    build.onLoad({ filter: /.*/, namespace: "shim-jsx" }, () => ({ contents: jsxShim, loader: "js" }));
  },
});

async function bundle({ stdin, entryPoints, globalName, shimUi = false }) {
  const res = await esbuild.build({
    ...(stdin ? { stdin } : { entryPoints }),
    bundle: true,
    write: false,
    format: "iife",
    globalName,
    jsx: "automatic",
    jsxImportSource: "react-shim",
    define: { "import.meta.env": "{}" },
    plugins: [makeShims(shimUi)],
    logLevel: "silent",
    absWorkingDir: ROOT,
  });
  return res.outputFiles[0].text;
}

// ── run ───────────────────────────────────────────────────────────────────────
rmSync(STAGE, { recursive: true, force: true });
const write = (rel, data) => {
  const p = path.join(STAGE, rel);
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, data);
};

const names = Object.keys(cfg.componentSrcMap);
const sourceHashes = {};
const writes = [];

for (const name of names) {
  const group = GROUP[name];
  if (!group) throw new Error(`no group for ${name}`);
  const dir = `components/${group}/${name}`;
  const storySrc = readFileSync(storyPath(name), "utf8");
  const exps = extractExports(storySrc);

  const files = {
    [`${dir}/${name}.html`]: htmlFor(name, group),
    [`${dir}/${name}.jsx`]: jsxFor(name),
    [`${dir}/${name}.d.ts`]: dtsFor(name),
    [`${dir}/${name}.prompt.md`]: promptFor(name, group, exps),
  };
  for (const [rel, data] of Object.entries(files)) {
    write(rel, data);
    writes.push(rel);
  }
  for (const ext of ["jsx", "d.ts", "prompt.md"]) {
    sourceHashes[`${dir}/${name}.${ext}`] = sha(files[`${dir}/${name}.${ext}`]).slice(0, 12);
  }

  // compiled preview (from the story file)
  const js = await bundle({ entryPoints: [storyPath(name)], globalName: "__dsPreview", shimUi: true });
  write(`_preview/${name}.js`, js);
  writes.push(`_preview/${name}.js`);
}

// ── shared CSS artifacts ──
const { tokens, utilities, components, styles } = await buildParts();
const dsBundleCss = [tokens, utilities, components].join("\n");
write("_ds_bundle.css", dsBundleCss);
write("styles.css", styles);
writes.push("_ds_bundle.css", "styles.css");

// ── library bundle (window.ReactorSheet incl. VellumRoot) ──
const bundleEntry = `export * from ${JSON.stringify(path.join(ROOT, "src/ReactorSheet/components/ui/index.ts"))};
export { VellumRoot } from ${JSON.stringify(path.join(DS, "vellum-root.tsx"))};`;
const dsBundleJs = await bundle({
  stdin: { contents: bundleEntry, resolveDir: ROOT, loader: "ts" },
  globalName: "ReactorSheet",
});
write("_ds_bundle.js", dsBundleJs);
writes.push("_ds_bundle.js");

// ── tokens dump (parse _ds_bundle.css) ──
// Token kind taxonomy matched to the remote manifest (confirmed by the parent):
//   text-color tokens (--text*, --stamp-text*) → "font"
//   font families / line-heights / grain       → "other"
//   dimensions (radii, spacers, font-sizes, …) → "spacing"
//   everything else (bg/surface/border/accent) → "color"
function classifyKind(name, value) {
  if (name === "--text" || name.startsWith("--text-") || name.startsWith("--stamp-text")) return "font";
  if (["--display", "--serif", "--sans", "--mono", "--vellum-grain"].includes(name) || name.startsWith("--lh-"))
    return "other";
  if (/^-?[\d.]+(px|rem|em|%|vh|vw|ch|fr|s|ms|deg)$/i.test(value.trim())) return "spacing";
  return "color";
}
function parseTokens(css, definedIn, toks, seen) {
  const rootRe = /\.reactor-sheet\b/;
  postcss.parse(css).walkRules((rule) => {
    if (rule.parent?.type === "atrule") return; // skip @media/@supports overrides
    const scope = rule.selectors.find((s) => rootRe.test(s));
    if (!scope) return;
    rule.walkDecls((d) => {
      if (!d.prop.startsWith("--")) return;
      const key = `${scope}|${d.prop}`;
      if (seen.has(key)) return;
      seen.add(key);
      toks.push({ name: d.prop, value: d.value.trim(), kind: classifyKind(d.prop, d.value), definedIn, scope });
    });
  });
  return toks;
}
// Vellum tokens live in _ds_bundle.css; the per-kind (hireling) overrides live in
// the app styles.css — include both so the manifest carries every themed scope.
const tokensDump = [];
const tokSeen = new Set();
parseTokens(dsBundleCss, "_ds_bundle.css", tokensDump, tokSeen);
parseTokens(styles, "styles.css", tokensDump, tokSeen);

// ── fonts (from fonts.css) ──
const fontsCss = readFileSync(path.join(DS, "..", "src/ReactorSheet/styles/vellum/fonts.css"), "utf8");
const fonts = [];
{
  const faceRe = /@font-face\s*\{([^}]*)\}/g;
  let f;
  while ((f = faceRe.exec(fontsCss))) {
    const b = f[1];
    const fam = (b.match(/font-family:\s*"([^"]+)"/) || [])[1];
    const file = (b.match(/url\("([^"]+)"\)/) || [])[1];
    const weight = (b.match(/font-weight:\s*([^;]+);/) || [])[1]?.trim() || "400";
    const style = (b.match(/font-style:\s*([^;]+);/) || [])[1]?.trim() || "normal";
    fonts.push({ family: fam, weight, style, cssPath: "fonts/fonts.css", files: [file.replace(/^\.\//, "fonts/").replace(/^fonts\/fonts\//, "fonts/")] });
  }
}

// Remote lists components/cards alphabetically (exemplar: "Button..Toggle").
const sortedNames = [...names].sort();
const manifest = {
  namespace: cfg.globalName,
  components: sortedNames.map((n) => ({ name: n, sourcePath: `components/${GROUP[n]}/${n}/${n}.jsx` })),
  startingPoints: [],
  cards: sortedNames.map((n) => {
    const c = { path: `components/${GROUP[n]}/${n}/${n}.html`, group: GROUP[n] };
    if (WIDE.has(n)) c.viewport = "900x700";
    return c;
  }),
  templates: [],
  globalCssPaths: ["fonts/fonts.css", "_ds_bundle.css", "styles.css"],
  tokens: tokensDump,
  themes: [
    { selector: '.reactor-sheet[data-theme="cream"]', label: "Reactor Sheet Cream" },
    { selector: ".reactor-sheet[data-kind=hireling]", label: "Reactor Sheet Kind Hireling" },
  ],
  fonts,
  brandFonts: [{ family: "IM Fell English SC", status: "unreferenced", tokens: [], path: "fonts/fonts.css" }],
  source: "design-sync-cli",
};
write("_ds_manifest.json", JSON.stringify(manifest, null, 2) + "\n");
writes.push("_ds_manifest.json");

// ── _ds_sync.json ──
// Reproducible fields recomputed; opaque tool-internal hashes (renderHashes,
// sourceKeys, keyRecipe) left empty and governed by _ds_needs_recompile.
const sync = {
  shape: "package",
  styleSha: sha(dsBundleCss + "\n" + styles),
  renderHashes: {},
  sourceKeys: {},
  keyRecipe: 7,
  scriptsSha: "db90aa22b3ed1d3a",
  sourceHashes,
  auxSha: "dcc299ae02e9069a",
  bundleSha12: sha(dsBundleJs).slice(0, 12),
};
write("_ds_sync.json", JSON.stringify(sync) + "\n");
writes.push("_ds_sync.json");

// recompile flag (empty)
write("_ds_needs_recompile", "");
writes.push("_ds_needs_recompile");

writeFileSync(
  path.join(STAGE, "PLAN.json"),
  JSON.stringify(
    {
      writes: writes.sort(),
      deletes: [],
      notes: [
        "preview cards now sourced from src/ReactorSheet/**/<Name>.stories.tsx (named exports); .design-sync/previews/ deleted. Story ui/* imports mapped to window.ReactorSheet via esbuild resolve shim (all imported symbols verified as bundle exports — no source fallbacks needed).",
        "KvCard had no story — split its KeyValue example out of Card.stories.tsx into a new KvCard.stories.tsx (removes design-card duplication).",
        `version string = reactor-sheet@${pkgVersion}. html/jsx/d.ts of the 24 existing components stay byte-identical to remote; prompt.md + _preview/*.js now differ (richer story sources, e.g. Tag gains Removable/Chips) — expected churn from the stories switch.`,
        "sourceHashes recipe = sha256(fileBytes)[:12] — CONFIRMED against remote (Tag.jsx/d.ts/prompt.md, Button.prompt.md all matched). Unchanged jsx/d.ts stay byte-identical; prompt.md hashes change (richer story sources).",
        "renderHashes/sourceKeys left {} and keyRecipe=7 carried; _ds_needs_recompile written so the tool recomputes opaque hashes (do NOT splice remote render hashes — Wave-2 CSS changes made them stale).",
        "styleSha = sha256(_ds_bundle.css + '\\n' + styles.css); bundleSha12 = sha256(_ds_bundle.js)[:12] — inferred recipes; scriptsSha/auxSha carried from remote.",
        "tokens[].kind matched to remote taxonomy (confirmed): text colors (--text*/--stamp-text*)→font; families/line-heights/--vellum-grain→other; dimensions→spacing; rest→color.",
        "README.md exists on remote but has no exemplar — deliberately NOT generated/staged (left as-is).",
        "config.dtsPropsFor reconciled against current Props: Tag (+variant/icon/tooltip/onRemove/removeLabel), Button (+\"outline\"), Die (sides: 4|6|8|20). Other 29 verified in sync. Their d.ts + prompt.md (and sourceHashes) change accordingly.",
        "_vendor/react.js + react-dom.js unchanged remotely — NOT staged.",
        "deletes empty: remote's 24 components are a subset of the 32 written; no removals.",
      ],
    },
    null,
    2,
  ) + "\n",
);

console.log(`staged ${writes.length} files → ${path.relative(ROOT, STAGE)}`);
console.log(`components: ${names.length}, tokens: ${tokensDump.length}, fonts: ${fonts.length}`);
console.log(`Tag.prompt.md sourceHash = ${sourceHashes["components/display/Tag/Tag.prompt.md"]}`);
