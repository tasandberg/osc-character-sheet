// Screenshot every tab × theme × tier, plus the collapsed minibar, both modals
// and a real chat card, then run the scope check. Point it at two builds and
// diff the output directories.
//
//   node tools/visual/capture.mjs out/before
//
// See README.md — in particular, swapping builds means writing dist/main.css
// and dist/main.js IN PLACE. Replacing the dist directory does not propagate
// through the container's bind mount, and every diff comes back clean.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  open, createScratchActor, destroyScratchActor,
  setTier, setTheme, selectTab, TABS, TIERS, CSSOM_WALKER,
} from "./lib.mjs";

const out = process.argv[2];
if (!out) {
  console.error("usage: node tools/visual/capture.mjs <out-dir>");
  process.exit(1);
}
mkdirSync(out, { recursive: true });

const ACTOR = "OSC Visual Scratch";
const { browser, page, errors } = await open();
const actorId = await createScratchActor(page, ACTOR);
await page.waitForTimeout(1200);

const shot = async (name) => {
  const el = await page.$(".osc-sheet");
  await (el ?? page).screenshot({ path: path.join(out, `${name}.png`) });
};

// ── tabs × themes × tiers ─────────────────────────────────────────────────
for (const w of TIERS) {
  await setTier(page, actorId, w);
  await page.waitForTimeout(400);
  for (const theme of ["dark", "cream"]) {
    await setTheme(page, theme);
    for (const tab of TABS) {
      await selectTab(page, tab);
      await shot(`${w}-${theme}-${tab}`);
    }
  }
}

// ── chat card — the one piece that lives OUTSIDE .osc-sheet by design ─────
// Done before the modals: a modal left open swallows the click on the hit button.
await setTier(page, actorId, 920);
await setTheme(page, "dark");
await selectTab(page, "actions");
const hitSel = await page.evaluate((id) => {
  const w = globalThis.game.actors.get(id).items.find((i) => i.type === "weapon");
  return w ? `[data-testid="weapon-hit-${w.id}"]` : null;
}, actorId);
if (hitSel) {
  await page.waitForSelector(`.osc-sheet ${hitSel}`, { timeout: 30_000 });
  await page.click(`.osc-sheet ${hitSel}`);
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    for (const app of globalThis.foundry.applications.instances.values()) {
      const ok = app.element?.querySelector?.(
        'button[data-action="ok"], button[data-button="ok"], button[type="submit"], .dialog-button',
      );
      if (ok) ok.click();
    }
  });
  await page.waitForFunction(() => !!document.querySelector(".osc-message"), null, { timeout: 15_000 }).catch(() => {});
}
const card = await page.$(".chat-message.osc-message, #chat-log .osc-message");
if (card) await card.screenshot({ path: path.join(out, "chat-card.png") });

// ── minibar: medium band only, and only once the header scrolls out ───────
await setTier(page, actorId, 560, 700);
await selectTab(page, "inventory");
await page.evaluate(() => {
  const s = document.querySelector(".osc-sheet .osc-sheet-body");
  if (s) s.scrollTop = 400;
});
await page.waitForTimeout(600);
await shot("minibar-collapsed-560");

// ── modals ────────────────────────────────────────────────────────────────
await setTier(page, actorId, 920);
await selectTab(page, "actions");
await page.evaluate(() => {
  [...document.querySelectorAll(".osc-sheet .osc-tb-btn")]
    .find((x) => (x.textContent || "").toLowerCase().includes("edit"))
    ?.click();
});
await page.waitForTimeout(900);
await shot("modal-edit");
await page.keyboard.press("Escape");
await page.waitForTimeout(400);

await page.evaluate(() => {
  [...document.querySelectorAll(".osc-sheet .osc-tb-btn")]
    .find((x) => x.getAttribute("aria-label") === "Settings")
    ?.click();
});
await page.waitForTimeout(700);
await shot("modal-settings");
await page.keyboard.press("Escape");
await page.waitForTimeout(400);

// ── scope check, with the chat card in the DOM ────────────────────────────
const scope = await page.evaluate(`(() => {
  ${CSSOM_WALKER}
  const outside = [...document.querySelectorAll("body *")].filter((e) => !e.closest(".osc-sheet"));
  const { rules, sheetsReached, styleRulesTotal } =
    __ourSheets((h) => /osc-character-sheet/.test(h || ""));

  const expected = [], unexpected = [];
  let selectorsTested = 0;
  for (const [sel] of rules) {
    for (const part of __splitSelectors(sel)) {
      selectorsTested++;
      let hit;
      try { hit = outside.find((e) => e.matches(part)); } catch { continue; }
      if (!hit) continue;
      const line = part + "  ->  " + hit.tagName.toLowerCase() +
        [...hit.classList].map((c) => "." + c).join("");
      // chat.scss styles the host's chat <li> ON PURPOSE, gated behind the
      // .osc-message marker our renderChatMessageHTML handler adds.
      (/\\.osc-message|\\.osc-card/.test(part) ? expected : unexpected).push(line);
    }
  }
  return {
    sheetsReached, styleRulesTotal,
    ourRules: rules.length, selectorsTested,
    outsideElements: outside.length,
    chatCardPresent: !!document.querySelector(".osc-message"),
    expected: [...new Set(expected)].length,
    unexpected: [...new Set(unexpected)],
  };
})()`);

// Print the counts, always. A scope check that reports only "0 leaks" cannot be
// told apart from one that examined nothing — which has happened here twice.
console.log(
  `sheets=${scope.sheetsReached} rules=${scope.styleRulesTotal} ours=${scope.ourRules} ` +
    `selectors=${scope.selectorsTested} outsideEls=${scope.outsideElements}`,
);
console.log(`chat card present: ${scope.chatCardPresent}`);
console.log(`intentional out-of-sheet matches (.osc-message/.osc-card): ${scope.expected}`);
console.log(`UNEXPECTED LEAKS: ${scope.unexpected.length}`);
for (const l of scope.unexpected.slice(0, 30)) console.log("  " + l);
console.log(`page errors: ${errors.length ? errors.slice(0, 8).join(" | ") : "none"}`);

writeFileSync(path.join(out, "scope.json"), JSON.stringify(scope, null, 1));
await destroyScratchActor(page, actorId);
await browser.close();
if (scope.unexpected.length) process.exitCode = 1;
