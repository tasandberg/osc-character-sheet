// Pixel-diff two screenshot directories, ignoring the top N device-pixels.
//
//   node tools/visual/diff.mjs out/before out/after [cropPx]
//
// The crop is not cosmetic: the Foundry window title bar renders the git branch
// name, so it differs in EVERY shot between two builds and would otherwise put a
// floor of ~0.1% under every number and hide the small real differences.
//
// Uses a headless canvas rather than an image library, so this adds no
// dependency beyond the Playwright the e2e suite already has.
import { chromium } from "../e2e/node_modules/playwright/index.mjs";
import { readdirSync, readFileSync } from "node:fs";

const [a, b, cropArg] = process.argv.slice(2);
if (!a || !b) {
  console.error("usage: node tools/visual/diff.mjs <before-dir> <after-dir> [cropPx]");
  process.exit(1);
}
const CROP = Number(cropArg ?? 120);

const browser = await chromium.launch();
const page = await browser.newPage();
const rows = [];

for (const name of readdirSync(a).sort()) {
  if (!name.endsWith(".png")) continue;
  let da, db;
  try {
    da = "data:image/png;base64," + readFileSync(`${a}/${name}`).toString("base64");
    db = "data:image/png;base64," + readFileSync(`${b}/${name}`).toString("base64");
  } catch {
    console.log(`  MISSING in one side: ${name}`);
    continue;
  }
  const r = await page.evaluate(async ([sa, sb, crop]) => {
    const load = (s) => new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = s;
    });
    const [ia, ib] = await Promise.all([load(sa), load(sb)]);
    if (ia.width !== ib.width || ia.height !== ib.height)
      return { size: `${ia.width}x${ia.height} -> ${ib.width}x${ib.height}` };
    const grab = (img) => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const x = c.getContext("2d");
      x.drawImage(img, 0, 0);
      return x.getImageData(0, crop, img.width, Math.max(1, img.height - crop)).data;
    };
    const pa = grab(ia), pb = grab(ib);
    let diff = 0, firstRow = -1;
    for (let i = 0; i < pa.length; i += 4)
      if (Math.abs(pa[i] - pb[i]) > 8 || Math.abs(pa[i + 1] - pb[i + 1]) > 8 || Math.abs(pa[i + 2] - pb[i + 2]) > 8) {
        diff++;
        if (firstRow < 0) firstRow = Math.floor(i / 4 / ia.width) + crop;
      }
    return { diff, total: pa.length / 4, firstRow };
  }, [da, db, CROP]);
  rows.push([name, r]);
}
await browser.close();

rows.sort((x, y) => (y[1].diff ?? 0) / (y[1].total ?? 1) - (x[1].diff ?? 0) / (x[1].total ?? 1));
let clean = 0;
for (const [name, r] of rows) {
  if (r.size) { console.log(`  SIZE  ${name}  ${r.size}`); continue; }
  const pct = (r.diff / r.total) * 100;
  if (pct === 0) { clean++; continue; }
  // The first differing row is what makes this bisectable — it points straight
  // at the element that moved instead of just scoring the page.
  console.log(`${pct.toFixed(2).padStart(6)}%  ${name}  (first differing row y=${r.firstRow})`);
}
console.log(`\n${clean}/${rows.length} identical below y=${CROP}`);
