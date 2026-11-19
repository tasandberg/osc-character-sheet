import vellumScope from "@old-school-chronicle/vellum/postcss-scope";

const ROOT = ".osc-sheet";
const scope = vellumScope({ root: ROOT });

// Vite resolves postcss config once, not per file, so the path filter has to live
// in the plugin. It is not an optimisation: chat.scss styles Foundry's own chat
// <li> on purpose, outside .osc-sheet, and scoping it would delete the chat card.
const SCOPED = ["/styles/vellum/", "/@old-school-chronicle/vellum/"];

const TOKENS = "/@old-school-chronicle/vellum/tokens.css";
const CHAT_CARD = ".osc-message";
const CHAT_CARD_CREAM = [
  `body.theme-light ${CHAT_CARD}:not(.themed *)`,
  `.themed.theme-light ${CHAT_CARD}:not(.themed.theme-light .themed.theme-dark *)`,
];
const chatCardSelectors = (sel) => {
  if (sel === ROOT) return [sel, CHAT_CARD];
  if (/^\.osc-sheet\[data-theme="?cream"?\]$/.test(sel)) return [sel, ...CHAT_CARD_CREAM];
  return [sel];
};

export const scopeVellum = {
  postcssPlugin: "scope-vellum",
  Rule(rule) {
    const file = rule.source?.input?.file;
    if (!file || !SCOPED.some((dir) => file.includes(dir))) return;
    // The sheet's reset descends from a full-page prototype and still targets
    // `body`. vellumScope collapses :root/html onto the root but not body, which
    // would nest it onto a descendant that never exists.
    rule.selectors = rule.selectors.map((sel) => (sel.trim() === "body" ? ROOT : sel));
    scope.Rule(rule);
    if (file.endsWith(TOKENS)) rule.selectors = rule.selectors.flatMap(chatCardSelectors);
  },
};
