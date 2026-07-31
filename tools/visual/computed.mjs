// Capture the COMPUTED style of every element the sheet renders, keyed by DOM
// path, across every tab and tier. Point it at two builds and run compare.mjs.
//
//   node tools/visual/computed.mjs out/before.json
//
// Why computed style and not "count the CSS rules that match this element":
// a selector inside an unmatched @container still satisfies el.matches(), so
// that measure reports an element as styled when its rule is not applying. It
// scored a KNOWN-BROKEN build as clean. Computed style is what actually renders,
// so a difference here is a visual difference by construction.
import { writeFileSync } from "node:fs";
import {
  open, createScratchActor, destroyScratchActor,
  setTier, selectTab, TABS, TIERS,
} from "./lib.mjs";

const out = process.argv[2];
if (!out) {
  console.error("usage: node tools/visual/computed.mjs <out.json>");
  process.exit(1);
}

const PROPS = [
  "display", "position", "gridTemplateColumns", "gridTemplateAreas", "gridArea",
  "flexDirection", "flexWrap", "flex", "alignItems", "justifyContent", "alignSelf",
  "gap", "rowGap", "columnGap",
  "marginTop", "marginRight", "marginBottom", "marginLeft",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "width", "height", "minWidth", "minHeight", "maxWidth",
  "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing",
  "textAlign", "textTransform", "textDecorationLine", "whiteSpace", "overflow",
  "color", "backgroundColor", "backgroundImage",
  "borderTopWidth", "borderBottomWidth", "borderLeftWidth", "borderRightWidth",
  "borderTopColor", "borderBottomColor", "borderRadius", "boxShadow", "opacity",
];

const ACTOR = "OSC Computed Scratch";
const { browser, page } = await open();
const actorId = await createScratchActor(page, ACTOR);
await page.waitForTimeout(1200);

const result = {};
for (const w of TIERS) {
  await setTier(page, actorId, w);
  await page.waitForTimeout(500);
  for (const tab of TABS) {
    await selectTab(page, tab);
    const rows = await page.evaluate((props) => {
      const out = {};
      const root = document.querySelector(".osc-sheet");
      // Key on STRUCTURE, not on class signature: the classes are exactly what
      // changes between builds, so keying on them would fail to line elements up.
      const pathOf = (el) => {
        const parts = [];
        for (let e = el; e && e !== root; e = e.parentElement)
          parts.unshift([...(e.parentElement?.children ?? [])].indexOf(e));
        return parts.join("/");
      };
      for (const el of root.querySelectorAll("*")) {
        const c = getComputedStyle(el);
        const rec = {};
        for (const p of props) rec[p] = c[p];
        rec.__cls = [...el.classList].filter((x) => !x.startsWith("tw:")).join(".");
        out[pathOf(el)] = rec;
      }
      return out;
    }, PROPS);
    for (const [k, v] of Object.entries(rows)) result[`${w}|${tab}|${k}`] = v;
  }
}

writeFileSync(out, JSON.stringify(result));
console.log(`captured ${Object.keys(result).length} element states -> ${out}`);
await destroyScratchActor(page, actorId);
await browser.close();
