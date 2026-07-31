// Shared plumbing for the visual-regression harness. See README.md.
//
// Playwright comes from the e2e suite's own node_modules so this tool adds no
// dependency to the module's build/runtime deps (same reasoning as tools/e2e).
import { chromium } from "../e2e/node_modules/playwright/index.mjs";

export const URL = (process.env.FOUNDRY_URL || "http://localhost:30000").replace(/\/$/, "");

/** The user to drive the world as. NEVER the world's primary Gamemaster by
 *  default: Foundry accepts a duplicate join and kicks the existing session, so
 *  running this against a world someone is using would boot them. Seed a spare
 *  GM and pass it here. */
export const USER = process.env.FOUNDRY_USER || "GM 3";

export async function open({ width = 1700, height = 1050, scale = 2 } = {}) {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: scale,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text().slice(0, 160)}`));

  await page.goto(`${URL}/join`, { waitUntil: "domcontentloaded" });
  await page.locator('select[name="userid"]').waitFor({ timeout: 30_000 });
  await page.locator('select[name="userid"]').selectOption({ label: USER });
  await page.click('button[name="join"]');
  await page.waitForFunction(() => globalThis.game?.ready === true, null, { timeout: 120_000 });

  await page.evaluate(() => {
    // Foundry's notification overlay intercepts clicks, and its toasts land in
    // screenshots non-deterministically — a stray "caching finished" toast is
    // otherwise indistinguishable from a styling change.
    const s = document.createElement("style");
    s.textContent = "#notifications{display:none !important;pointer-events:none !important}";
    document.head.appendChild(s);
    globalThis.ui?.notifications?.clear?.();
  });

  return { browser, page, errors };
}

/** Create a throwaway actor with enough content that every tab renders something.
 *  Always paired with `destroyScratchActor` — never reuse a real character. */
export async function createScratchActor(page, name) {
  return page.evaluate(async (name) => {
    const g = globalThis;
    for (const a of [...g.game.actors].filter((a) => a.name === name)) await a.delete();
    const actor = await g.Actor.create({
      name,
      type: "character",
      system: {
        hp: { value: 7, max: 9 },
        ac: { value: 6 },
        initiative: { value: 1 },
        spells: { enabled: true },
        details: { class: "Magic-User", notes: "<p>Scratch notes.</p>" },
      },
      flags: { core: { sheetClass: "ose.OscSheet" } },
    });
    await actor.createEmbeddedDocuments("Item", [
      { name: "Scratch Sword", type: "weapon", system: { damage: "1d8", melee: true, missile: true, equipped: true } },
      { name: "Scratch Robe", type: "armor", system: { aac: { value: 2 }, equipped: true } },
      { name: "Scratch Rations", type: "item", system: { quantity: { value: 5, max: 10 } } },
      { name: "Scratch Sleep", type: "spell", system: { lvl: 1, memorized: 1, cast: 0 } },
      { name: "Scratch Lore", type: "ability", system: {} },
    ]);
    await actor.sheet.render(true);
    for (let i = 0; i < 60 && !(actor.sheet.element instanceof HTMLElement); i++)
      await new Promise((r) => setTimeout(r, 50));
    return actor.id;
  }, name);
}

export async function destroyScratchActor(page, id) {
  await page.evaluate(async (id) => {
    const g = globalThis;
    const a = g.game.actors.get(id);
    if (a) await a.delete();
    // The rolls this run posted, and any macro OSE auto-created for the weapon.
    for (const m of [...g.game.messages].filter((m) => /Scratch/.test(m.content ?? ""))) await m.delete();
    for (const m of [...g.game.macros].filter((m) => /Scratch/.test(m.name ?? ""))) await m.delete();
  }, id);
}

/** Resize the FOUNDRY WINDOW, not the browser — the sheet's tiers are container
 *  queries on its own frame, so the viewport is the wrong knob. */
export const setTier = (page, id, width, height = 820) =>
  page.evaluate(
    ([id, w, h]) => globalThis.game.actors.get(id).sheet.setPosition({ width: w, height: h, left: 30, top: 30 }),
    [id, width, height],
  );

/** `data-theme` lives on the AppV2 window root (`.osc-sheet`), NOT on
 *  `.osc-sheet-app`. Setting it on the latter silently does nothing. */
export const setTheme = (page, theme) =>
  page.evaluate((t) => {
    for (const el of document.querySelectorAll(".osc-sheet, .osc-sheet-app")) el.dataset.theme = t;
  }, theme);

export async function selectTab(page, name) {
  await page.evaluate((t) => {
    const b = [
      ...document.querySelectorAll(".osc-sheet .osc-tab, .osc-sheet .osc-htab, .osc-sheet .osc-botbtn"),
    ].find((x) => (x.textContent || "").toLowerCase().includes(t));
    b?.click();
  }, name);
  await page.waitForTimeout(350);
}

export const TABS = ["actions", "inventory", "spells", "abilities", "notes"];
export const TIERS = [920, 560, 390];

// ── CSSOM walking, in-page ────────────────────────────────────────────────
//
// Injected as a string because it runs inside page.evaluate. Two traps it
// avoids, BOTH of which silently make a check pass on nothing — see README.
export const CSSOM_WALKER = `
  const __ourSheets = (isOurs) => {
    const seen = new Set();
    const rules = [];
    let sheetsReached = 0, styleRulesTotal = 0;
    const visit = (sheet, inherited) => {
      if (!sheet || seen.has(sheet)) return;
      seen.add(sheet); sheetsReached++;
      const href = sheet.href || inherited;
      let rr;
      try { rr = sheet.cssRules; } catch { return; }   // cross-origin: not ours
      walk(rr, href);
    };
    const walk = (rr, href) => {
      for (const r of rr) {
        // An @import'ed sheet is NOT a document.styleSheets entry.
        if (r.styleSheet) { visit(r.styleSheet, r.href || href); continue; }
        if (r.selectorText) {
          styleRulesTotal++;
          if (isOurs(href)) rules.push([r.selectorText, r.style ? r.style.length : 0]);
          // A style rule's own cssRules is EMPTY BUT TRUTHY (nested CSS), so it
          // must be length-checked or every style rule gets skipped as a group.
          if (r.cssRules && r.cssRules.length) walk(r.cssRules, href);
          continue;
        }
        if (r.cssRules && r.cssRules.length) walk(r.cssRules, href);
      }
    };
    for (const s of document.styleSheets) visit(s, s.href);
    return { rules, sheetsReached, styleRulesTotal };
  };

  // Split a selector list on TOP-LEVEL commas only. A naive split tears
  // ':is(h1,h2,h3)' into bare 'h2'/'h3' fragments, which then "match" the host's
  // own headings and report leaks that do not exist.
  const __splitSelectors = (sel) => {
    const out = []; let depth = 0, cur = "";
    for (const ch of sel) {
      if (ch === "(" || ch === "[") depth++;
      else if (ch === ")" || ch === "]") depth--;
      if (ch === "," && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim()).filter(Boolean);
  };
`;
