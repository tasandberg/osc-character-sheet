# osc-character-sheet — repo guide

React OSE character sheet for Foundry v13/v14. Consumes `foundry-vtt-react`; renders the
`ose` system's data model. Manifest is `module.json`. Workspace-level cross-project context
lives in `../CLAUDE.md`.

## Dev

- pnpm. `pnpm dev` (vite, serves into local Foundry), `pnpm build` (`tsc -b && vite build`),
  `pnpm lint`, `pnpm test` (vitest). Verify changes with all four before committing.
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
