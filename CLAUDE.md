# osc-character-sheet — repo guide

React OSE character sheet for Foundry v13/v14. Consumes `foundry-vtt-react`; renders the
`ose` system's data model. Manifest is `module.json`. Workspace-level cross-project context
lives in `../CLAUDE.md`.

## Code comments (hard rule)

- Default to NO comment. Add one ONLY for a constraint the code can't show.
- If you must: ONE short line. Never multi-line blocks or paragraphs.
- NEVER reference Linear tickets (OSC-##) in code comments — that context lives in the PR/commit.
- No rationale / tool-choice / background prose in source; it goes in the PR or commit message.

## Dev

- pnpm. `pnpm dev` (vite, serves into local Foundry), `pnpm build` (`tsc -b && vite build`),
  `pnpm lint`, `pnpm test` (vitest), `pnpm verify:classes`. Verify changes with all five
  before committing.
- **`pnpm verify:classes`** (after `pnpm build` — it reads `dist/main.css`). Every semantic
  class the sheet renders must be matched by a rule in the compiled CSS, sit on an element
  carrying a `tw:`/`u-` utility, or be declared in `tools/class-hooks.json` with a reason.
  This is the gate for "styling deleted, conversion described but never done" — lint, the
  unit tests and the build all stay green through that. A declared hook that stops being
  rendered also fails, so the allowlist can't rot.
- **Whole-tab stories** live in `src/OscSheet/stories/` over one shared fixture actor
  (`fixtures.ts`), with Foundry's globals stubbed in `.storybook/foundry-stub.ts`.
  `stories.smoke.test.tsx` mounts every story in the repo — a Storybook *build* never renders
  a story, so it alone proves nothing. Add the story with the tab, not after it.
- App entry: `src/OscSheet/index.tsx` → `OscSheetProvider` (Foundry actor sync) →
  `SheetShell` (view-models + layout slots) → tab bodies. State = React Context + Foundry
  actor as source of truth; view-models in `viewModels/` compute derived data.
- **Styling — utilities first.** Prefer Vellum `u-*` utility classes (in JSX) and
  `components/ui/` primitives over hand-written `.osc-*` classes + SCSS. Reach for a utility
  or primitive before authoring any bespoke rule; reserve SCSS for genuinely bespoke bits
  (hover/selected/focus states, `color-mix`, gradients, positioning, `@container` queries,
  structural resets). Don't hand-roll flex/gap/margin/padding/align/font-size/radius/color —
  those are utilities. **Full guide → the `vellum-styling` skill** (`.claude/skills/vellum-styling/`).
- Tokens/spacing: use the `--space-*`/`--spacer-*` (4px) scale and design tokens, never
  hardcoded px or invented colors. Brass = `--accent-alt`; equipped = `--teal`.
- UI vocabulary: reach for the `components/ui/` primitives (`Button`, `IconButton`, `Tag`,
  `SectionTitle`, `Stamp`, `Field`, `Modal`, …) before hand-rolling a new `.osc-*`
  button/heading/tag class. Their styles live in `styles/vellum/` and are auto-scoped under
  `.osc-sheet`, so they beat the `.osc-sheet-app … { all: unset }` reset.
- Guardrails (run by `pnpm lint`): **stylelint** forbids bare px `font-size` / hex colors in
  `styles/*.scss` (`var(--token, #fallback)` is fine; `vellum/` and sub-10px glyph sizes are
  exempt — the latter via an inline `// stylelint-disable-line` + reason), and an **ESLint**
  rule bans literal color/px in inline `style={{}}` (dynamic values like `` `${x}%` `` are fine;
  the legacy tree is exempt).

## Refactor / cleanup backlog

**Keep this list current as we build.** When a file grows unwieldy or a responsibility
wants its own module, add it here (don't silently let files balloon). Prune entries when done.

- **`src/OscSheet/features/inventory/InventoryViewDnd.tsx` (~1000 lines)** — too big. Holds
  the root component AND a dozen sub-components (EquippedTray, ItemContextMenu, ContainerRow,
  SortableRow, SortHeader(Row), CoinRow, EncumbranceBar, NameCell, RowEquip…). Split sub-
  components into their own files (e.g. `inventory/EquippedTray.tsx`, `ItemContextMenu.tsx`,
  `rows/`), and lift the groups↔VM helpers (`buildGroups`, `persist`, etc.) into a module.
- **`src/OscSheet/app/SheetShell.tsx`** — accumulating item-mutation handlers (equip/nest/
  consume/reorder/equippedOrder + toasts). Extract into a `useInventoryActions(actor, items)`
  hook.
- **`src/OscSheet/styles/inventory.scss` (~570 lines)** — split alongside the component
  breakup (equipped tray, rows, container, sticky head as separate partials).
