#!/usr/bin/env node
// Ad-hoc styling metrics for src/ — a trend indicator for the UI-consolidation
// effort, not a compiler. Regex-based; run via `pnpm style-metrics`.
// Reports: inline style={{}} usage, ad-hoc SCSS rule lines (outside vellum/),
// and hardcoded px/hex values. Emits a table + one JSON line for diffing.

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "src");
const SCSS_DIR = path.join(root, "src/OscSheet/styles");

// ── file walking ────────────────────────────────────────────────────────
function walk(dir, test) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (name === "node_modules") continue;
    if (statSync(full).isDirectory()) out.push(...walk(full, test));
    else if (test(full)) out.push(full);
  }
  return out;
}

// ── comment stripping (for hex/px scans; keeps line count intact) ─────────
const stripComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

// ── inline style={{ … }} extraction (brace-balanced) ──────────────────────
function extractInlineStyles(src) {
  const blocks = [];
  let i = 0;
  while ((i = src.indexOf("style={{", i)) !== -1) {
    let depth = 0;
    let j = i + "style={".length; // start at the outer `{`
    for (; j < src.length; j++) {
      const c = src[j];
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    blocks.push(src.slice(i + "style={{".length, j - 1));
    i = j + 1;
  }
  return blocks;
}

// property keys = `{`- or `,`-preceded identifiers followed by `:`
// (skips ternary `? a : b` colons, which aren't key-preceded).
const countProps = (block) =>
  (block.match(/(?:^|[{,])\s*['"]?[\w-]+['"]?\s*:/g) || []).length;

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const PX = /\b\d+(?:\.\d+)?px\b/g;
// hex used as a var() fallback — allowed, so we subtract these from the count.
const VAR_FALLBACK_HEX = /var\(\s*--[\w-]+\s*,\s*(#[0-9a-fA-F]{3,8})/g;
const countMatches = (s, re) => (s.match(re) || []).length;

// ── SCSS: rule lines (non-blank, non-comment) + hardcoded values ─────────
const scssFiles = statSyncSafe(SCSS_DIR)
  ? walk(SCSS_DIR, (f) => f.endsWith(".scss") && !f.includes("/vellum/"))
  : [];

function statSyncSafe(p) {
  try {
    return statSync(p);
  } catch {
    return null;
  }
}

const scssPerFile = {};
let scssRuleLines = 0;
let scssHex = 0;
let scssPx = 0;
for (const f of scssFiles.sort()) {
  const raw = readFileSync(f, "utf8");
  const noComments = stripComments(raw);
  const ruleLines = noComments
    .split("\n")
    .filter((l) => l.trim().length > 0).length;
  const hex = countMatches(noComments, HEX) - countMatches(noComments, VAR_FALLBACK_HEX);
  const px = countMatches(noComments, PX);
  scssPerFile[path.relative(SCSS_DIR, f)] = { ruleLines, hex, px };
  scssRuleLines += ruleLines;
  scssHex += hex;
  scssPx += px;
}

// ── TSX: inline styles (app vs. stories), hardcoded values ────────────────
const tsxFiles = walk(SRC, (f) => f.endsWith(".tsx"));
const app = { files: 0, styleProps: 0, cssProps: 0, hex: 0, px: 0 };
const stories = { files: 0, styleProps: 0, cssProps: 0, hex: 0, px: 0 };
for (const f of tsxFiles) {
  const bucket = f.endsWith(".stories.tsx") ? stories : app;
  const blocks = extractInlineStyles(readFileSync(f, "utf8"));
  if (blocks.length === 0) continue;
  bucket.files++;
  bucket.styleProps += blocks.length;
  for (const b of blocks) {
    bucket.cssProps += countProps(b);
    bucket.hex += countMatches(b, HEX);
    bucket.px += countMatches(b, PX);
  }
}

// ── output ────────────────────────────────────────────────────────────────
const pad = (s, n) => String(s).padEnd(n);
const num = (s, n) => String(s).padStart(n);

console.log("\nInline styles (style={{ }})");
console.log(`  ${pad("bucket", 10)} ${num("files", 6)} ${num("props", 6)} ${num("cssDecls", 9)} ${num("hex", 5)} ${num("px", 5)}`);
console.log(`  ${pad("app", 10)} ${num(app.files, 6)} ${num(app.styleProps, 6)} ${num(app.cssProps, 9)} ${num(app.hex, 5)} ${num(app.px, 5)}`);
console.log(`  ${pad("stories", 10)} ${num(stories.files, 6)} ${num(stories.styleProps, 6)} ${num(stories.cssProps, 9)} ${num(stories.hex, 5)} ${num(stories.px, 5)}`);

console.log("\nAd-hoc SCSS (src/OscSheet/styles/*.scss, outside vellum/)");
console.log(`  ${pad("file", 22)} ${num("rules", 6)} ${num("hex", 5)} ${num("px", 5)}`);
for (const [f, m] of Object.entries(scssPerFile)) {
  console.log(`  ${pad(f, 22)} ${num(m.ruleLines, 6)} ${num(m.hex, 5)} ${num(m.px, 5)}`);
}
console.log(`  ${pad("TOTAL", 22)} ${num(scssRuleLines, 6)} ${num(scssHex, 5)} ${num(scssPx, 5)}`);

const json = {
  inlineApp: { files: app.files, styleProps: app.styleProps, cssProps: app.cssProps, hex: app.hex, px: app.px },
  inlineStories: { files: stories.files, styleProps: stories.styleProps, cssProps: stories.cssProps, hex: stories.hex, px: stories.px },
  scss: { files: scssFiles.length, ruleLines: scssRuleLines, hex: scssHex, px: scssPx },
};
console.log("\n" + JSON.stringify(json));
