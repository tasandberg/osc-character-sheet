# design-sync NOTES — Vellum DS (reactor-sheet)

Repo-specific gotchas for future syncs. The synced surface is the `ui/` primitive
library under `src/ReactorSheet/components/ui/`.

## Non-standard setup (this repo has no published dist)

- **Shape: package, synth-entry from source.** `reactor-sheet` is a private Foundry
  module, not a published component package — there is no `dist/` with a global export.
  The converter bundles the `ui/` barrel directly: pass `--entry ./src/ReactorSheet/components/ui/index.ts`.
  `--entry` is REQUIRED — it makes the converter resolve `PKG_DIR` to the repo root
  (otherwise it looks for `node_modules/reactor-sheet`, which doesn't exist, and crashes).
- **Components are enumerated in `cfg.componentSrcMap`** (24 entries) because there's no
  `.d.ts` tree to auto-discover from. Adding a new primitive = add it to `ui/index.ts` AND
  `componentSrcMap`. Sub-component exports (Input, Th/Td/Tr, MenuLabel/Item/Sep) are bundled
  but intentionally have no card.
- **CSS is built, not copied.** Vellum CSS is scoped under `.reactor-sheet` (tokens via the
  `tools/postcss/scope-vellum.mjs` plugin; `styles.scss` scopes itself). `cfg.cssEntry` points
  at `.design-sync/.cache/vellum-bundle.css`, produced by `cfg.buildCmd`
  (`node .design-sync/build-css.mjs` = sass + the postcss scoper, concatenated). Fonts ship
  separately via `cfg.extraFonts` (fonts.css → fonts/).
- **Provider = `VellumRoot`** (`.design-sync/vellum-root.tsx`, wired via `extraEntries` +
  `cfg.provider`). It wraps every preview in `.reactor-sheet > .reactor-sheet-app` so the
  scoped CSS applies. Without it previews render unstyled.

## Re-sync procedure

1. `pnpm i --frozen-lockfile` (worktrees/fresh clones have no node_modules).
2. Re-copy staged scripts into `.ds-sync/` (per the skill's `cp -r` line) and
   `cd .ds-sync && npm i esbuild ts-morph @types/react playwright@1.60.0`.
3. Run `cfg.buildCmd` (regenerates `.cache/vellum-bundle.css`) BEFORE the converter.
4. Run the driver / `package-build.mjs` with the `--entry` flag above and
   `--node-modules ./node_modules`.

## Render check

- **playwright 1.60.0** is pinned to match the cached `chromium-1223` build
  (`~/Library/Caches/ms-playwright`). playwright@latest pins 1228 (not cached) and would
  trigger a ~200MB download — keep 1.60.0 unless the cache changes.

## Known render warns (triaged — re-syncs check against this list)

- `[TOKENS_MISSING] --font-h1, --color-text-emphatic, --color-text-primary,
  --color-text-secondary` — these live ONLY in `src/ReactorSheet/styles/_util.scss` (legacy
  utility classes) and are not referenced by any `ui/` primitive. They ride in because
  `build-css.mjs` compiles the full `styles.scss` (which `@use`s `_util`). Non-blocking; no
  primitive preview is affected. (Could be eliminated by trimming `_util` from the CSS build
  if it ever matters.)
- `[FONT_MISSING] IBM Plex Mono` was suppressed via `cfg.runtimeFontPrefixes` — it's only a
  fallback in the `--mono` stack; JetBrains Mono (the primary) ships.

## Card-mode overrides (cfg.overrides)

- `Menu`, `SectionTitle` → `cardMode: column` (multi-cell, wider than a grid cell).
- `Modal` → `cardMode: single`, `primaryStory: LevelUp` (overlay; renders contained with
  `open=true`, but single keeps it clean). Toast renders fine in the default grid.

## Grouping

- Groups come from a one-line `@category` JSDoc on each component's source export
  (Controls/Display/Layout/Overlays/Navigation/Data). Adding a primitive → add its
  `@category`. KvCard needs its OWN `@category` (it's the 2nd export in Card.tsx).

## Parallel story set (Storybook)

- The repo ALSO has Storybook stories at `src/ReactorSheet/components/ui/*.stories.tsx` — a
  separate catalog from the synced `.design-sync/previews/*.tsx`. The sync (package shape)
  reads ONLY `previews/`, never the stories. They're independent files: when you change a
  component's authored preview, mirror the same exports into its `*.stories.tsx` so the two
  catalogs don't drift (e.g. SectionTitle's `Sub`/`Bare` variants live in both).

## Re-sync risks (what can silently go stale)

- **`build-css.mjs` mirrors the app pipeline by hand.** If the repo changes how Vellum CSS
  is scoped/compiled (postcss config, new style partial, sass version), this script can drift
  from the real app output. Re-check `vellum-bundle.css` scoping after any styles refactor.
- **`componentSrcMap` is a manual list.** New primitives won't sync until added; renamed/moved
  files break their entry.
- **No dist = grades tied to source paths.** A component file move changes its render hash and
  forces re-verify — expected, not a bug.
- The 4 `_util` TOKENS_MISSING vars are accepted as legacy; if `_util.scss` is cleaned up they
  disappear (good), or if a primitive starts using them they must be added to tokens.
