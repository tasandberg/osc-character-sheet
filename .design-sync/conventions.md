# Vellum DS — how to build with these components

Vellum is the **Old School Chronicle** character-sheet design system: an OSE/B-X
tabletop aesthetic — dark "inked parchment" surfaces, brass + teal + crimson accents,
`IM Fell English` display serif over an Inter sans body. Components are the real
`osc-character-sheet` React library, rendered from `window.OscSheet.*`.

## Wrapping (required)

Every component reads its theme tokens from a scoped root. **Wrap your whole tree in
`<VellumRoot>`** (exported from the bundle) — it provides the `.osc-sheet` /
`.osc-sheet-app` containers the styles are scoped under. Without it, components
render unstyled (no tokens, no fonts).

```jsx
<VellumRoot>
  {/* your screen */}
</VellumRoot>
```

The default theme is dark. The cream/parchment theme is opt-in via a `data-theme="cream"`
attribute on a `.osc-sheet` ancestor.

## Styling idiom — props on components, tokens for your own glue

- **Style components through their props, never by hand-writing their CSS classes.**
  The visual variants are enumerated props: `variant` (Button: `primary`/`danger`/`ghost`;
  IconButton: `accent`/`danger`/`round`), `intent` (Tag: `teal`/`crimson`/`forest`/
  `mustard`/`solid`; Toast: `success`/`danger`/`warning`), `size` (Stamp: `sm`/`md`/`lg`).
  Read each component's `<Name>.d.ts` for its exact API and `<Name>.prompt.md` for a
  worked example.
- **For your own layout/glue, use the Vellum CSS variables** (do not invent colors, fonts,
  or px values — these tokens are the design language and both themes redefine them):
  - Color: `--bg`, `--bg-2` (surfaces), `--text`, `--text-dim` (ink), `--teal`,
    `--crimson`, `--brass` (= `--accent-alt`), `--on-accent`.
  - Type: `--display` (Fell English caps), `--serif`, `--sans` (Inter), `--mono`;
    sizes `--fs-2xs … --fs-8xl` (`--fs-base` is the body anchor).
  - Space: `--spacer-1 … --spacer-12` (4px scale). Radii: `--r-sm`/`--r-md`/`--r-lg`/`--r-xl`.

  ```jsx
  <div style={{ display: "flex", gap: "var(--spacer-3)", color: "var(--text-dim)" }}>…</div>
  ```

## Section headers — use `<SectionTitle>`, never a bold white underline

Section/group headings are a defining part of the Vellum look and they are **subtle**:
display serif (`--display`) at normal weight in `--text` ink, over a thin **2px
`var(--section-rule)`** hairline (= `--border`, a muted parchment/ink line — NOT white,
NOT thick/heavy). Always render them with the `<SectionTitle>` component:

```jsx
<SectionTitle hint="3 prepared">Spells</SectionTitle>   {/* main head: serif + hairline rule */}
<SectionTitle variant="sub">Equipped</SectionTitle>     {/* small uppercase sans label, no rule */}
<SectionTitle variant="bare">Modal title</SectionTitle> {/* serif, no rule/margins (embedded heads) */}
```

**Do not** hand-roll a heading as bold white text with a heavy or white underline — that
reads as a different design system. If you must style a heading yourself, match the
component: `font-family: var(--display)`, normal weight, `color: var(--text)`, and a
`2px solid var(--section-rule)` bottom border (none for `sub`/`bare`).

## Where the truth lives

- `styles.css` is the whole styling closure (it `@import`s `_ds_bundle.css` — the scoped
  component styles — plus tokens and `fonts/`). Read it before styling.
- Per component: `components/<group>/<Name>/<Name>.d.ts` (the API) and `<Name>.prompt.md`
  (usage). Groups: Controls, Display, Layout, Overlays, Navigation, Data.

## Idiomatic snippet

```jsx
<VellumRoot>
  <Card>
    <SectionTitle hint="3 prepared">Spells</SectionTitle>
    <div style={{ display: "flex", gap: "var(--spacer-2)", marginTop: "var(--spacer-2)" }}>
      <Tag intent="teal">Cleric</Tag>
      <Tag intent="crimson">Magic-User</Tag>
    </div>
    <Field label="Hit Points">
      <Input defaultValue="8" />
    </Field>
    <Button variant="primary">Memorize a spell</Button>
  </Card>
</VellumRoot>
```
