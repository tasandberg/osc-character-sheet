// Compare two computed-style captures, filtering differences that are
// serialisation artifacts rather than rendering changes.
//
//   node tools/visual/compare.mjs out/before.json out/after.json
import { readFileSync } from "node:fs";

const [a, b] = process.argv.slice(2);
if (!a || !b) {
  console.error("usage: node tools/visual/compare.mjs <before.json> <after.json>");
  process.exit(1);
}
const A = JSON.parse(readFileSync(a, "utf8"));
const B = JSON.parse(readFileSync(b, "utf8"));

// Split on top-level commas — `rgba(0, 0, 0, 0)` contains ", ".
const parts = (v) => {
  const out = [];
  let depth = 0, cur = "";
  for (const ch of v) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; } else cur += ch;
  }
  out.push(cur.trim());
  return out;
};

const SELF = { start: "flex-start", end: "flex-end" };
const norm = (p, v) => {
  // Tailwind serialises these differently from the same hand-written value.
  if (p === "alignSelf" || p === "alignItems" || p === "justifyContent") return SELF[v] ?? v;
  if (p === "boxShadow")
    return parts(v).filter((s) => s && !/^rgba\(0, 0, 0, 0\) 0px 0px 0px 0px$/.test(s)).join(", ") || "none";
  return v;
};
// A border colour only renders where that side has width.
const SIDE = { borderTopColor: "borderTopWidth", borderBottomColor: "borderBottomWidth",
               borderLeftColor: "borderLeftWidth", borderRightColor: "borderRightWidth" };
// Consequences of layout, not causes — reported separately so they don't drown
// the property that actually moved.
const DERIVED = new Set(["width", "height", "minHeight"]);

const byProp = new Map(), byEl = new Map();
let compared = 0, derivedOnly = 0;
for (const [k, va] of Object.entries(A)) {
  const vb = B[k];
  if (!vb) continue;
  compared++;
  const diffs = [];
  let real = false;
  for (const p of Object.keys(va)) {
    if (p === "__cls") continue;
    const x = norm(p, va[p]), y = norm(p, vb[p]);
    if (x === y) continue;
    if (SIDE[p] && va[SIDE[p]] === "0px" && vb[SIDE[p]] === "0px") continue;
    if (!DERIVED.has(p)) { real = true; byProp.set(p, (byProp.get(p) ?? 0) + 1); }
    diffs.push([p, `${p}: ${x} -> ${y}`]);
  }
  if (!diffs.length) continue;
  if (!real) { derivedOnly++; continue; }
  const key = `${k.split("|").slice(0, 2).join("|")}  .${va.__cls || vb.__cls || "(no class)"}`;
  if (!byEl.has(key)) byEl.set(key, [...new Set(diffs.filter(([p]) => !DERIVED.has(p)).map(([, d]) => d))]);
}

console.log(`elements compared: ${compared}`);
console.log(`elements with a REAL computed difference: ${byEl.size}`);
console.log(`elements differing only in derived width/height: ${derivedOnly}`);
console.log(`\nproperties that moved:`);
[...byProp].sort((x, y) => y[1] - x[1]).forEach(([p, n]) => console.log(`  ${String(n).padStart(4)}  ${p}`));
console.log(`\nelements:`);
[...byEl].forEach(([k, v]) => console.log(`  ${k}\n      ${v.slice(0, 4).join("\n      ")}`));
