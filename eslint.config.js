import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";

export default tseslint.config([
  globalIgnores([
    "dist",
    "foundry",
    ".claude",
    "tools/e2e/node_modules",
    "tools/e2e/test-results",
    "tools/e2e/playwright-report",
    "tools/e2e/blob-report",
    "tools/visual/out",
  ]),
  {
    files: ["src/**/*.{ts,tsx}", "*.ts"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Keep literal colors/px out of inline `style={{}}` — use a design token or
      // a CSS class. Only LITERAL values are flagged; dynamic ones (template
      // literals / expressions, e.g. the `${pct}%` bar widths) are exempt because
      // they aren't `Literal` nodes.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXAttribute[name.name='style'] Property > Literal[value=/#[0-9a-fA-F]{3,8}|[0-9]px/]",
          message:
            "Avoid literal colors/px in inline style={{}} — use a design token or a CSS class (dynamic values like `${x}%` are fine).",
        },
      ],
    },
  },
  {
    // Node scripts. Plain JS, so `js.configs.recommended` alone — adding the
    // typescript-eslint preset here would switch `no-undef` off and lose the
    // undeclared-global check these files depend on.
    files: ["tools/**/*.mjs", "*.mjs"],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  {
    // These scripts ship functions to the browser via page.evaluate, so browser
    // globals are legitimate alongside the Node ones.
    files: ["tools/visual/**/*.mjs", "tools/e2e/**/*.mjs"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    // Node-side tooling TypeScript (the PostCSS plugin's test, and anything
    // added later) — Node, not React. tools/e2e gets its own block below.
    files: ["tools/**/*.ts"],
    ignores: ["tools/e2e/**"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  {
    // Playwright specs/helpers: Node-flavoured, not React. page.evaluate callbacks
    // genuinely run in the browser, so both global sets are in scope.
    files: ["tools/e2e/**/*.ts"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      // Every `any` here is a Foundry browser global reached across the
      // page.evaluate boundary. No tsconfig covers `tools/` and Playwright
      // transpiles without checking, so annotations here would be unverified
      // by any gate. Re-enable once tools/e2e has its own typecheck.
      "@typescript-eslint/no-explicit-any": "off",
      // Playwright's worker-fixture signature is `async ({}, use, workerInfo)`.
      "no-empty-pattern": "off",
    },
  },
]);
