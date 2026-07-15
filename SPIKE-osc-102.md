# SPIKE — OSC-102: Option to increase font size

Exploratory prototype. Not production-final. Goal: find the cheap lever for an
accessibility font-size setting, learn what scales cleanly vs. what breaks, and
recommend a real implementation.

Branch: `tasandberg/osc-102-option-to-increase-font-size` (off `origin/main`).

## TL;DR

- A per-user font-scale **setting + live control works** and scaling the type is cheap.
- **The lever in the ticket premise is wrong.** Scaling `.osc-sheet-app { font-size }`
  does **not** scale the `--fs-*` tokens: they are `rem`, and `rem` resolves against the
  document root (`<html>`), never against an ancestor's font-size. The working lever is a
  **`--fs-scale` multiplier baked into the token emit** (`--fs-*: calc(<rem> * var(--fs-scale,1))`).
- Type then scales exactly (measured 13px → 16.9px at 1.3×). **Spacing and fixed widths do
  not scale** (they are px): row gaps stay 12/8/4px, the 184px vitals box stays 184px,
  fixed grid tracks (`… 62px 82px 96px`) stay put → text collides/overflows at larger scales.
- Recommendation: ship the token-emit multiplier as the mechanism; for a real release also
  move the **most crowded fixed tracks** (attack/inventory rows) toward `ch`/`rem`/`minmax`
  and spot-loosen a few container breakpoints. Full-fidelity spacing-scaling is a bigger job
  and probably not worth it for v1.

## Screenshot — 1.0 vs 1.3

`docs/osc102-md-vs-xl.png` (rendered against the real compiled `dist/main.css`):

- Left (`--fs-scale: 1.0`) vs right (`--fs-scale: 1.3`). Headings, HP numerals, body copy
  all grow proportionally — the type scaling is clean and even.
- The weapon row on the right shows the failure mode: fixed grid tracks did **not** grow, so
  the name column overruns and `Longsword` collides with `1d8`. The sub-10px `◆` glyph is
  orphaned (it doesn't scale — see below).

## What was built (prototype)

- `src/OscSheet/fontScale.ts` — mirrors `theme.ts`. Client setting `osc-character-sheet.fontScale`
  with choices `md` (1.0) / `lg` (1.15) / `xl` (1.3). `applyFontScale(root, scale)` sets
  `--fs-scale` on the window element (clears it at `md`). `cycleFontScale()` advances the setting.
- `src/applications/osc-sheet.js` — registers the setting (parallel to `theme`, same
  `onChange → re-render` fan-out) and calls `applyFontScale(this.element, …)` in `_onRender`,
  right beside `applyTheme`.
- `src/OscSheet/styles/vellum/tokens.scss` — the type-scale emit now multiplies in the var:
  `--fs-#{$step}: calc(#{$value} * var(--fs-scale, 1))`. This is the whole mechanism.
- `src/OscSheet/layout/Topbar.tsx` — temporary `A` button next to the theme toggle cycles
  Default → Large → Larger live (spike control; see "where the control should live").
- `src/OscSheet/fontScale.test.ts` — unit test mirroring `theme.test.ts`.

Because `tokens.scss` `:root` is rewritten to `.osc-sheet` by the `scope-vellum` PostCSS
plugin, the tokens AND `--fs-scale` both live on the window element (`this.element`, class
`osc-sheet`), so the var resolves on the same element that declares the tokens. The setting
is client-scoped, so it's genuinely per-user, like theme.

## Why the ticket's lever doesn't work (the key finding)

The ticket says: scale `.osc-sheet-app`'s 16px anchor and "every `--fs-*` rem token resolves
against this." That is not how `rem` works. `rem` = **root em** = the `<html>` font-size,
regardless of any ancestor. So:

- Setting `font-size` on `.osc-sheet-app` (or `.osc-sheet`) changes `em`/`%`/unitless
  children, but leaves every `--fs-*` token (all `rem`) untouched.
- The only anchor that would scale `rem` is `<html>` itself — which the codebase deliberately
  forbids touching (`tokens.scss:142` "Never override on `<html>`") because it is shared with
  all of Foundry's chrome; scaling it would resize sidebars, dialogs, chat, everything.

Note the "16px anchor" comments on `.osc-sheet-app` and `html` are effectively coincidental:
both happen to be 16px, so nobody noticed the tokens actually key off `<html>`, not the app.

The robust, scoped lever is therefore **the tokens themselves**, via `--fs-scale`. It needs
no `<html>` override, stays inside `.osc-sheet`, and every existing `var(--fs-*)` consumer
picks it up for free.

## What scales cleanly

Everything sized through a `--fs-*` token — which is nearly all sheet text: section titles,
stat numerals (HP/AC via `--fs-6xl`), ability scores, body copy, stamps, tags. Measured in
the harness against real CSS: body `--fs-sm` went 13px → 16.9px at 1.3× (exactly ×1.3), and
the visual scaling across the card is even. Line-height tokens are unitless multipliers, so
leading grows with the text too. No per-component work needed for any of this.

## What does NOT scale — and is it acceptable?

Measured at 1.0 vs 1.3 in the harness (same compiled CSS):

| Thing | 1.0 | 1.3 | Scales? |
| --- | --- | --- | --- |
| Body text (`--fs-sm`) | 13px | 16.9px | ✅ yes |
| Row gap (`--spacer-3`) | 12px | 12px | ❌ no |
| Vitals box width | 184px | 184px | ❌ no |
| Sub-10px glyph | 9px | 9px | ❌ no |

1. **Px spacers (`--spacer-*`, the 4px scale).** Fixed. Text grows inside unchanged padding
   and gaps, so everything tightens. At 1.15× it reads as pleasantly denser; at 1.3× it's
   visibly cramped (stamps and numerals crowd their neighbours). **Partly acceptable** —
   readable but not polished. A real fix would move key paddings/gaps to `rem` or a parallel
   `--space-scale`.

2. **Fixed-width grid columns / boxes.** The worst offender. Examples found:
   - `.osc-vitals` **184px** (`actions.scss:219`)
   - attack table `grid-template-columns: minmax(0,1fr) 62px 82px 96px` (`actions.scss:614`)
   - inventory row tracks, coin/tag columns, various `width: 52/110/112px`
   These don't grow, so larger text **overflows or wraps inside a fixed track** — see the
   `Longsword1d8` collision in the screenshot. **Not acceptable at 1.3×** for the dense
   tabular rows (attacks, inventory); tolerable for the looser cards. These need `ch`-based
   or `minmax(rem, …)` tracks to scale with type.

3. **Sub-10px glyph exemptions** (8px sort caret `inventory.scss:172`, 9px tag icon `:985`,
   9px prepared-check `spells.scss:74`). Hardcoded px, stay fixed. They're decorative glyphs
   next to text, so at larger scales they look proportionally undersized/misaligned (the
   orphaned `◆` in the shot). **Cosmetically off but low-severity.** Cheap to move to a token
   or a small `em` value if we want them to track.

4. **Container-query breakpoints (the subtle one).** The layout switches panes/rails at fixed
   **px container widths** (`@container app (max-width: 479px)`, `sheet (min-width: 470px)`,
   `740px`, etc. — px, because container queries can't read `var()`, so `_scales.scss`
   `$foundry-breakpoints` is a Sass map). The container width is unchanged by font scale, but
   the **content inside it is bigger**, so at a given window width the sheet behaves as if it
   were narrower: earlier wrapping, earlier overflow, and the two-pane/xs breakpoints trip at
   the same widths even though the content now needs more room. Net: a user at Large may need
   to widen the window to avoid the compact layout kicking in prematurely. **Acceptable for a
   spike; a real ship should consider nudging a couple of these edges up when a scale is active**
   (e.g. via a scale-aware class on the window rather than changing the px maps).

## Recommendation for a real implementation

1. **Mechanism: keep the `--fs-scale` token-emit multiplier.** It's one line in `tokens.scss`,
   scoped, and free for every `--fs-*` consumer. Do **not** pursue the `.osc-sheet-app`
   font-size approach (doesn't work) or an `<html>` override (bleeds into Foundry).
2. **Scale spacing partially, not fully.** Full spacer-scaling is a large, risky change
   (every layout assumption tuned against the 4px px grid). For v1, leave `--spacer-*` fixed
   and instead loosen the few genuinely tight, high-value fixed tracks:
   - Move the **attack table** and **inventory row** grid tracks off hard px to `ch`/`rem` or
     `minmax(<rem>, …)` so they grow with type. These are where scaling actually breaks.
   - Optionally add a `--space-scale` later if user feedback says the density is too tight.
3. **Sub-10px glyphs:** swap the 3 hardcoded px glyphs for a small `em` (e.g. `0.6em`) so they
   track the text. Trivial.
4. **Breakpoints:** ship as-is for a first pass; if the premature-compaction is reported,
   add a `data-fs="lg|xl"` on the window and bump the two or three container edges under that
   attribute. Don't touch the shared `$foundry-breakpoints` map globally.
5. **Setting + control placement:** keep it a **client setting** (per-user, like theme) —
   already registered and shows in Foundry's module settings. For an in-sheet control, the
   spike put a cycling `A` button next to the theme toggle in the topbar; that's a reasonable
   home, but a 3-way segmented control (Default/Large/Larger) or a small select reads clearer
   than a mystery cycle button. Alternatively drop the topbar control and rely solely on the
   settings menu. Either is fine.

### Rough effort

- **Mechanism + setting + settings-menu control:** essentially done here — ~0.5 day to
  productionize (finalize control UX, drop the spike button or replace with a segmented control).
- **Fix the breaking fixed tracks (attacks + inventory):** ~1 day, mostly careful CSS + visual
  QA across tabs at each scale.
- **Optional spacing scale + breakpoint nudges:** ~1–2 days if pursued; recommend deferring
  until there's user feedback.
- **Total for a solid v1** (type scales, tabular rows don't break, glyphs track): **~1.5–2 days.**

## Verification

- `pnpm build` ✅  ·  `pnpm lint` ✅  ·  `pnpm test` ✅ (175 tests, incl. new `fontScale.test.ts`).
- Emitted CSS confirmed: `--fs-md:calc(.875rem * var(--fs-scale,1))`.
- Measured scaling in-browser against `dist/main.css` (numbers in the table above).

## Files touched

- `src/OscSheet/fontScale.ts` (new)
- `src/OscSheet/fontScale.test.ts` (new)
- `src/applications/osc-sheet.js` (register setting + apply in `_onRender`)
- `src/OscSheet/styles/vellum/tokens.scss` (token emit `× var(--fs-scale)`)
- `src/OscSheet/layout/Topbar.tsx` (spike cycle control)
- `docs/osc102-md-vs-xl.png` (evidence)
