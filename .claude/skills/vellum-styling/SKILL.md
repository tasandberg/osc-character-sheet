---
name: vellum-styling
description: Use when styling the OSC character sheet — writing or editing JSX className, adding/changing SCSS in src/OscSheet/styles/, choosing spacing/colors/font-sizes, or deciding between a utility class, a ui/ primitive, and bespoke SCSS. Covers the Vellum design system: u-* utility classes, design tokens, and the components/ui primitives.
---

# Vellum styling (osc-character-sheet)

Vellum is this repo's design system: single-source token scales, `u-*` utility
classes, and a set of `components/ui/` React primitives. **Style by composing
these — not by hand-writing `.osc-*` classes and SCSS.**

## The rule (utilities-first)

1. **Layout / spacing / alignment / font-size / radius / color → `u-*` utility
   classes in the JSX.** Never hand-write an `.osc-*` class (or an inline
   `style={{}}` with token vars) for flex, gap, margin, padding, `align/justify`,
   `font-size`, `border-radius`, or palette color when a utility exists.
2. **Reusable widget → a `components/ui/` primitive.** Reach for one before
   hand-rolling a button/tag/heading/card/field.
3. **SCSS only for genuinely bespoke bits:** `:hover`/`.is-selected`/focus states,
   `color-mix`, gradients, absolute positioning, `@container` responsive rules,
   `display:contents` tricks, structural resets. If it's just flex+gap+color+
   font-size, it belongs in the JSX as utilities.

Keep component class *hooks* (`.osc-tb-btn`, etc.) when they're selectors/
specificity anchors or referenced by responsive rules — compose utilities
*alongside* them; don't delete the hook.

## Utility classes  (`src/OscSheet/styles/vellum/utilities.scss`)

Prefix `u-`. Values are always tokens — never invent a value.

- **Layout:** `u-row` (flex row · align center · gap-2), `u-stack` (flex col · gap-3),
  `u-flex`, `u-inline-flex`, `u-flex-1` (grow + min-width:0), `u-flex-none`,
  `u-wrap`/`u-nowrap`, `u-grid`, `u-grid-2|3|4`
- **Gap:** `u-gap-N`, `u-gap-x-N`, `u-gap-y-N`  (N on the spacer scale)
- **Align:** `u-items-{start|center|end|stretch|baseline}`,
  `u-justify-{start|center|end|between|around}`
- **Spacing:** `u-p*`/`u-m*` on the spacer scale — `u-p-N`, `u-px-N`, `u-py-N`,
  `u-pt/pr/pb/pl-N`, `u-m-N`, `u-mx/my/mt/mr/mb/ml-N`, plus keyword
  `u-m-auto`/`u-mx-auto`/`u-mt-auto`/`u-mr-auto`/`u-ml-auto`
- **Font size:** `u-fs-{3xs…8xl}` (see scale below)
- **Radius:** `u-r-{sm|md|lg|xl}`
- **Color:** text `u-text`, `u-text-{dim|muted|faint|accent|brass|danger|warn|success|on-accent}`;
  bg `u-bg`, `u-bg-{2|surface|surface-2|surface-3|ink|accent|brass|danger}`;
  border `u-border`, `u-border-{soft|accent|brass|danger|none}`
- **Foundry responsive display:** `u-foundry-{tier}-display-{value}` (`value` =
  `none|flex|block|grid|inline-flex`). Tiers `xs`=0 (base) / `md`=480 / `lg`=740
  (`sm` reserved, unused) are min-width "and up" on the `app` container. Mobile-
  first hide/show — e.g. `u-foundry-xs-display-none u-foundry-md-display-flex`
  (hidden on narrow, shown ≥480).

Note: there is **no** "flex column without gap" utility (`u-stack` forces gap-3).
A tight/no-gap column stays bespoke SCSS.

Compose freely: `<div className="u-row u-gap-3 u-items-center u-px-4">`.

Specificity: utilities are scoped `.osc-sheet .u-*` (0,2,0) — they beat the
`.osc-sheet-app` reset (0,1,1). A more-specific bespoke rule
(`.osc-topbar .osc-tb-btn`, 0,2,0 + tag) can still win; if a utility loses,
either keep that prop in SCSS or don't half-convert it.

## Tokens  (ship from `@old-school-chronicle/vellum`)

The `--fs-*`/`--r-*`/`--spacer-*` custom properties come from the npm package —
`node_modules/@old-school-chronicle/vellum/tokens.css`, with the matching Tailwind
scale in its `theme.css`, both generated from the same maps so they can't drift.
They are NOT in this repo; `_scales.scss` and `tokens.scss` no longer exist here.

Verify a value before you size against it — `grep -o -- "--fs-[a-z0-9]*:[^;]*" dist/main.css`.
The list below has been wrong before, and a size derived from a wrong token is
wrong everywhere it lands.

- **Spacer** `--spacer-N` = N×4px, curated (no 7/9/11): `1 2 3 4 5 6 8 10 12`.
  Also `--space-*` aliases. Use these / `u-*` — never bare px.
- **Font size** `--fs-*`: `4xs`8 `3xs`11 `2xs`12 `xs`13 `sm`14 `md`15 `base`16
  `lg`17 `xl`19 `2xl`22 `3xl`26 `4xl`30 `5xl`35 `6xl`41 `7xl`47 `8xl`60 (px @16
  root). Every step also scales with `--fs-scale` (the sheet's font-size setting).
  `--fs-4xs` is a token only — there is no `u-fs-4xs`.
- **Radius** `--r-*`: `sm`4 `md`6 `lg`10 `xl`14.
- **Palette** (theme-aware, dark + cream): `--ink`, `--bg`/`--bg-2`,
  `--surface`/`-2`/`-3`, `--text`/`-dim`/`-mute`/`-faint`, `--border`/`-soft`,
  `--teal` (accent / equipped), `--crimson`, `--forest`, `--mustard`,
  `--accent-alt` (**brass**), `--gold` (=mustard), `--on-accent`. Use tokens /
  color utilities — never a hex or invented color.

## `components/ui/` primitives

Reach for these before hand-rolling. Their styles live in `styles/vellum/` and
auto-scope under `.osc-sheet` (they beat the app reset).

Button · IconButton · InlineButton · Tag · Stamp · StampCell · SectionHeader ·
SectionTitle · Card · KvCard · Field · NumberInput · ValidatedInput · Textarea ·
Select · Segmented · Radio · Check · Toggle · Stepper · Menu · Modal ·
ConfirmDialog · Table · Tabs · Pips · ProgressBar · StatPlaque · Monogram ·
PortraitField · Die · Empty · Skeleton · Toast/ToastHost · ProseMirrorEditor.

`Button` — variants `primary` (brass fill) · `outline` · `danger` · `ghost`, plus
`size="sm"`. The `outline` variant takes a color `tone`: `accent` (teal), `brass`
(brass-gold), `danger` (crimson), `success` (forest), `warn` (mustard) — generated
from the palette-synced `$btn-outline-tones` map in `vellum/sheet-base.scss`, so tone
names track the color vocabulary and can't drift.

Read them in `src/OscSheet/components/ui/`; there is no component workbench in this
repo — see them for real via `pnpm dev` in a local Foundry world.

## Guardrails (run by `pnpm lint`)

- **stylelint** forbids bare px `font-size` and hex colors in `styles/*.scss`
  (`var(--token, #fallback)` is fine; `vellum/` and sub-10px glyph sizes are
  exempt — the latter via inline `// stylelint-disable-line` + reason).
- **ESLint** bans literal color/px in inline `style={{}}` (dynamic values like
  `` `${x}%` `` are fine; the legacy tree is exempt).

## File map

- `@old-school-chronicle/vellum` (npm) — `tokens.css` defines every `--*` custom
  property and theme; `theme.css` is the matching Tailwind `@theme` block. Read
  them in `node_modules/`; they are not editable from this repo.
- `styles/vellum/utilities.scss` — emits `u-*` classes
- `styles/vellum/sheet-base.scss` — component classes (`.stamp`, `.plaque-*`, …)
  and the `$btn-outline-tones` map
- `styles/*.scss` (actions, inventory, shell, …) — per-feature bespoke SCSS
- `components/ui/*` — the primitive components
