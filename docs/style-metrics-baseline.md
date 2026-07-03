# Style metrics — baseline

Ad-hoc styling snapshot for the UI-consolidation effort. Regenerate with
`pnpm style-metrics`; this is a trend indicator (regex-based), not a compiler.

- **Date:** 2026-07-02
- **Commit:** d6745ee (branch `feat/ui-consolidation-p1`, pre-utilities)

## Inline styles (`style={{ }}`)

| bucket  | files | props | cssDecls | hex | px |
| ------- | ----: | ----: | -------: | --: | -: |
| app     |     4 |    15 |       19 |   0 |  0 |
| stories |    27 |    47 |      144 |   3 |  1 |

`props` = count of `style={{…}}` attributes; `cssDecls` = CSS declarations
within them. Stories are demo scaffolding — tracked separately, not a target.

## Ad-hoc SCSS (`src/ReactorSheet/styles/*.scss`, outside `vellum/`)

| file             | rules | hex |  px |
| ---------------- | ----: | --: | --: |
| \_mixins.scss    |     9 |   0 |   3 |
| actions.scss     |   645 |   2 | 228 |
| chat.scss        |   139 |  14 |  30 |
| edit-modal.scss  |    59 |   0 |  24 |
| features.scss    |   106 |   0 |  32 |
| inventory.scss   |   432 |   0 | 158 |
| minibar.scss     |   153 |   0 |  28 |
| notes.scss       |    44 |   0 |  16 |
| shell.scss       |   231 |   0 |  56 |
| spells.scss      |   128 |   0 |  47 |
| styles.scss      |   103 |   1 |  14 |
| **TOTAL**        |  2049 |  17 | 636 |

`rules` = non-blank, non-comment lines. `hex`/`px` = hardcoded colors / px
values (var() fallbacks excluded from hex).

## JSON (diff line)

```json
{"inlineApp":{"files":4,"styleProps":15,"cssProps":19,"hex":0,"px":0},"inlineStories":{"files":27,"styleProps":47,"cssProps":144,"hex":3,"px":1},"scss":{"files":11,"ruleLines":2049,"hex":17,"px":636}}
```

---

## After B1 (OLD-5/6/7)

- **Commit:** 6a7abb0 (branch `feat/ui-consolidation-p1`)
- **Note:** the baseline above (d6745ee) predates Phase 0. The true pre-B1 tip is
  `ac52a56` (utilities + metrics landed), whose story counts already include
  Phase-0's `Utilities.stories.tsx` (14 inline props). **B1 is exactly flat vs
  that pre-B1 tip on every metric** — both new stories (SectionHeader, Pips) use
  `u-*` utilities with zero inline `style={{}}`, and the Pips vellum base
  (`.pips`/`.pip`) lives under `vellum/`, so it doesn't count against the
  non-vellum `.rs-*` total.

| Checkpoint | inline app (files/props/decls) | inline stories | non-vellum scss (rules/hex/px) |
| ---------- | ------------------------------ | -------------- | ------------------------------ |
| Pre-B1 tip (ac52a56) | 4 / 15 / 19 | 28 / 61 / 179 | 2049 / 17 / 636 |
| After B1 (6a7abb0)   | 4 / 15 / 19 | 28 / 61 / 179 | 2049 / 17 / 636 |

```json
{"inlineApp":{"files":4,"styleProps":15,"cssProps":19,"hex":0,"px":0},"inlineStories":{"files":28,"styleProps":61,"cssProps":179,"hex":3,"px":1},"scss":{"files":11,"ruleLines":2049,"hex":17,"px":636}}
```

---

## After B2 (OLD-8/9)

- **Commit:** 64fe6b2 (branch `feat/ui-consolidation-p1`)
- **Note:** inline app + story counts stay flat — OLD-8 replaced inline HP logic
  with a hook (no `style={{}}` involved), and the new StatPlaque story uses `u-*`
  utilities. The only movement is **+1 non-vellum SCSS rule / +1 px**, entirely
  from the one documented `.fvtt-save .stamp.sk` reconciliation in `actions.scss`
  (the §2.1 saves-stamp consistency fix — re-asserts the 22px square now that
  `.sk` is a `<Stamp>`; the +1 px is the `12px` in its `var(--fs-xs, 12px)`
  fallback). The StatPlaque `.plaque` base lives under `vellum/`, so it doesn't
  count here.

| Checkpoint | inline app (files/props/decls) | inline stories | non-vellum scss (rules/hex/px) |
| ---------- | ------------------------------ | -------------- | ------------------------------ |
| After B1 (6a7abb0) | 4 / 15 / 19 | 28 / 61 / 179 | 2049 / 17 / 636 |
| After B2 (64fe6b2) | 4 / 15 / 19 | 28 / 61 / 179 | 2050 / 17 / 637 |

```json
{"inlineApp":{"files":4,"styleProps":15,"cssProps":19,"hex":0,"px":0},"inlineStories":{"files":28,"styleProps":61,"cssProps":179,"hex":3,"px":1},"scss":{"files":11,"ruleLines":2050,"hex":17,"px":637}}
```

---

## After B3 (OLD-10)

- **Commit:** 008aaaf (branch `feat/ui-consolidation-p1`)
- **First real DROP, as expected.** Retiring `.fvtt-tag` from `actions.scss`
  (ported to vellum as `.tag.chip`, which is excluded from the non-vellum count)
  cut **non-vellum SCSS from 2050 → 2033 rules (−17) and 637 → 633 px (−4)**.
  Story inline-styles also ticked **down** (28/61/179 → 27/60/175) because
  utility-izing the Tag story replaced its one legacy inline `style={{}}` flex
  row with `u-row`/`u-gap`/`u-wrap`.

| Checkpoint | inline app (files/props/decls) | inline stories | non-vellum scss (rules/hex/px) |
| ---------- | ------------------------------ | -------------- | ------------------------------ |
| After B2 (64fe6b2) | 4 / 15 / 19 | 28 / 61 / 179 | 2050 / 17 / 637 |
| After B3 (008aaaf) | 4 / 15 / 19 | 27 / 60 / 175 | 2033 / 17 / 633 |

```json
{"inlineApp":{"files":4,"styleProps":15,"cssProps":19,"hex":0,"px":0},"inlineStories":{"files":27,"styleProps":60,"cssProps":175,"hex":3,"px":1},"scss":{"files":11,"ruleLines":2033,"hex":17,"px":633}}
```

## Wave summary (pre-B1 tip ac52a56 → After B3)

| Metric | Pre-B1 (ac52a56) | After B3 (008aaaf) | Δ |
| ------ | ---------------: | -----------------: | -: |
| inline app props | 15 | 15 | 0 |
| inline story props | 61 | 60 | −1 |
| non-vellum SCSS rules | 2049 | 2033 | −16 |
| non-vellum SCSS px | 636 | 633 | −3 |

The regex metrics only see the SCSS/inline-style surface; they don't capture the
DOM-level dedup (SectionHeader, Pips, Monogram routing, useHpInput, StatPlaque,
rollable, Tag variants) — the primary goal of the wave — which stays net-negative
on hand-rolled markup while metrics held flat-to-down throughout.
