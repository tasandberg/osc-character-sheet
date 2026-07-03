# Cloud / Headless Development

How autonomous / cloud agents build, verify, and preview this module **without a local Foundry server**. In-game checks aren't possible in the cloud — rely on the headless gates below plus the published Storybook preview.

## Stack & setup

- Package manager: **pnpm**. Node 22.x (repo built/tested on v22).
- Install: `pnpm install`.
- Key deps: Vite 8, React 19, TypeScript ~5.8, `foundry-vtt-react` (React-in-Foundry framework), Storybook (component workbench), vitest.

## What works headless (no Foundry needed)

These are the real gates a cloud agent can run:

- `pnpm exec tsc -b` — typecheck (project references via `tsconfig.json`).
- `pnpm build` — `tsc -b && vite build`; writes `dist/` (`main.js`, `main.css`, fonts).
- `pnpm lint` — `eslint .`.
- `pnpm test` — `vitest run` (currently ~11 tests). `pnpm test:watch` for watch mode.
- `pnpm storybook:build` / `pnpm storybook` — Storybook static build / dev server.

## What needs local Foundry (NOT available in cloud)

- `pnpm dev` (`vite`) renders the sheet **inside a running Foundry** via the dev proxy — no Foundry, nothing to see.
- In-game / visual verification uses the local **dockerized Foundry** (`local-foundry-docker` workflow).
- A cloud agent **cannot** do in-game checks. Substitute: the headless gates above + the published **Storybook preview**.

## CSS pipeline gotcha

- **Dev:** Vite injects the sheet CSS on mount — styles only appear once a sheet opens.
- **Prod:** `dist/main.css` (listed in `module.json` `styles`) loads globally.
- All Vellum tokens/reset are **scoped to `.osc-sheet-app`** (the React content) via `postcss.config.mjs` → `tools/postcss/scope-vellum.mjs`. The Foundry window titlebar/frame is intentionally untouched.

## Branch model

- `main` — **protected; never push.**
- `osc-sheet` — integration branch; feature branches merge in via PR. Foundation (P0+P1) is already merged here.
- `reskin/*` — feature branches (e.g. `reskin/foundation`, `reskin/ui-library`), PR'd into `osc-sheet`.

## Planning docs are mostly local

- `.gitignore` ignores `docs/plans/` (local planning). Other `docs/**` paths can be committed.
- A plan a cloud agent must execute has to be **committed explicitly** — e.g. a committed plan under `docs/superpowers/plans/`.
- This `CLOUD.md` is committed precisely because cloud agents need it at the repo root.

## Preview / deploy

- Storybook static build is published to **GitHub Pages** under `/osc-character-sheet/storybook/` — a `storybook/` subdir of the `gh-pages` branch, so it doesn't occupy the Pages root:
  ```bash
  pnpm storybook:build
  npx gh-pages -d storybook-static --dest storybook --add -b gh-pages
  ```
  `--add` updates only those files; the Pages root stays free. Requires Pages enabled on the repo once. Preview: `https://tasandberg.github.io/osc-character-sheet/storybook/`.
- **Alternative:** Netlify draft deploy with `NETLIFY_AUTH_TOKEN` — `pnpm dlx netlify-cli deploy --dir=storybook-static`.

## dist note

- `dist/` is **currently committed** (build output). A follow-up ([issue #7](https://github.com/tasandberg/osc-character-sheet/issues/7)) will stop committing it.
- Until then: if you change build output, rebuild (`pnpm build`) and commit `dist/`.
- `tools/release.mjs` runs `pnpm build` before zipping, so releases always ship fresh output.

## Verification checklist (before opening a PR)

1. `pnpm install`
2. `pnpm exec tsc -b` — clean
3. `pnpm lint` — clean
4. `pnpm test` — green
5. `pnpm build` — green
6. `pnpm storybook:build` — success; publish the preview for visual review
7. If build output changed, commit `dist/` (until issue #7 lands)
8. Branch off / PR into `osc-sheet` — never push `main`
