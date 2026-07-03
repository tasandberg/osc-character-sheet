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
