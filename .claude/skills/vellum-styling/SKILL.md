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

## Tokens  (`vellum/_scales.scss` → emits `--*` in `vellum/tokens.scss`)

Single-source Sass maps in `_scales.scss` emit BOTH the `--fs-*`/`--r-*`/
`--spacer-*` custom properties AND the matching `u-*` classes via `@each`. Never
hardcode a parallel list — that's the drift the system exists to prevent.

- **Spacer** `--spacer-N` = N×4px, curated (no 7/9/11): `1 2 3 4 5 6 8 10 12`.
  Also `--space-*` aliases. Use these / `u-*` — never bare px.
- **Font size** `--fs-*`: `3xs`10 `2xs`11 `xs`12 `sm`13 `md`14 `base`15 `lg`16
  `xl`18 `2xl`21 `3xl`24 `4xl`28 `5xl`33 `6xl`38 `7xl`44 `8xl`56 (px @16 root).
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
from the palette-synced `$btn-outline-tones` map in `vellum/tokens.scss`, so tone
names track the color vocabulary and can't drift. See its Storybook story.

Browse them in Storybook (`pnpm storybook`); `components/ui/Utilities.stories.tsx`
demos the utility classes live.

## Guardrails (run by `pnpm lint`)

- **stylelint** forbids bare px `font-size` and hex colors in `styles/*.scss`
  (`var(--token, #fallback)` is fine; `vellum/` and sub-10px glyph sizes are
  exempt — the latter via inline `// stylelint-disable-line` + reason).
- **ESLint** bans literal color/px in inline `style={{}}` (dynamic values like
  `` `${x}%` `` are fine; the legacy tree is exempt).

## File map

- `styles/vellum/_scales.scss` — the ONLY place type/radius/spacer steps live
- `styles/vellum/tokens.scss` — emits `--*` custom properties (+ light/dark themes)
- `styles/vellum/utilities.scss` — emits `u-*` classes
- `styles/*.scss` (actions, inventory, shell, …) — per-feature bespoke SCSS
- `components/ui/*` — the primitive components
