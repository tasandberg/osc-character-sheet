import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";

export default tseslint.config([
  // tools/e2e is a standalone Playwright package with its own toolchain/deps.
  globalIgnores(["dist", "foundry", "tools", ".claude", "storybook-static"]),
  {
    files: ["**/*.{ts,tsx}"],
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
    // Stories are dev-only mockups; inline literal styles are fine there.
    files: ["**/*.stories.tsx"],
    rules: { "no-restricted-syntax": "off" },
  },
]);
