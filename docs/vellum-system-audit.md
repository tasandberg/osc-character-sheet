# Vellum design-system audit & cleanup plan

Status: planned (no code changes yet). Scope: **live code paths only** — the
unmounted legacy tree (kept for reference) is explicitly out of scope.

## Background

The sheet has two style systems coexisting in the tree:

- **Vellum (live)** — CSS-variable tokens (`styles/vellum/tokens.css`,
  `components.css`) + `.osc-*`/`.fvtt-*` SCSS classes. This is everything mounted
  via `index.tsx → SheetShell → Shell`.
- **Legacy (dead, kept for reference)** — `styled-components` + the
  `shared/elements-vars.tsx` token object (`colors.bgDark = "#222"`, Foundry
  `--color-*` vars) + the Bootstrap half of `_util.scss`. Lives in `Layout.tsx`,
  `Header/`, `Footer/`, `Nav.tsx`, `ActorScores/`, `SheetPages/Actions/` (capital-A),
  `SheetPages/InventoryPage/`, `shared/elements*`, `GridTable`, `InlineInput`,
  `PropertiesGrid`, `TabContent`. **Not deleted, not in scope.**

The live component tree is otherwise clean: no `styled-components`, no
`elements-vars`, no hardcoded hex; the only inline `style={{}}` are legitimate
dynamic bar widths (`${pct}%`). So the real work is **SCSS token drift** plus
**component-vocabulary convergence**.

### Live surface

- Chrome: `chrome/` (Topbar, HeaderBand, Minibar)
- Tabs: `actions/` (ActionsView, AttacksTable, AbilityPlaques, SavesExploration),
  `inventory/InventoryViewDnd`, `SheetPages/Spells`, `SheetPages/Abilities`
  (FeatureCard), `SheetPages/Notes`
- Primitives: `ui/`; layout: `shell/Shell`
- SCSS: `shell · minibar · actions · inventory · features · spells` + `vellum/`
  (`spells.scss` / `features.scss` already token-clean)

> Note: `SheetPages/Spells|Abilities|Notes` are live via the `activeTab.Content`
> fallback in `SheetShell`. Only `SheetPages/Actions` and `SheetPages/InventoryPage`
> are shadowed (dead) — superseded by `actions/` and `inventory/InventoryViewDnd`.

## Decisions (locked)

- **Radius drift → snap to the existing `--r-*` scale** (`--r-sm 4 / --r-md 6 /
  --r-lg 10 / --r-xl 14`). No new token. Mapping:
  - `5px → --r-sm`, `7px → --r-md` (the main one, ~6×), `8px → --r-lg`
  - bare `4px → --r-sm`, bare `6px → --r-md`
- **Component convergence → full scope** (buttons + headings + tags), not just buttons.

---

## Phase 1 — SCSS token cleanup (mechanical, low-risk)

Do `components.css` first — it's the design-system source and currently
contradicts its own "always use `--fs-*`" rule.

1. **`vellum/components.css`** — replace hardcoded `font-size` literals
   (`11px / 13px / 13.5px / 14px / 22px`) across `.field`, `.input`, `.toggle`,
   `.menu`, `.tag`, `.modal-head .ttl`, `.table` with the nearest `--fs-*`. Fixing
   the source lets consumers inherit correct sizing.
2. **`actions.scss` / `inventory.scss` / `minibar.scss` / `shell.scss`**
   - Radius literals → `--r-*` per the mapping above.
   - px font-sizes → `--fs-*` (`actions.scss:73,417`, `inventory.scss:92,112,188`,
     `shell.scss:127`).
   - Ad-hoc `6/8/9px` gaps → `--spacer-2`.
   - `shell.scss` `#000` border → `--ink` / `--border`.
3. **Dedupe `--gold-bright: #57c3c3`** — defined twice (`shell.scss:107` +
   `styles.scss:107`); keep one.

## Phase 2 — Component-vocabulary convergence (the look-and-feel win)

The `ui/` primitives (`Button`, `Tag`, `SectionTitle`, `Modal`, `Stamp`) are solid
but underused; live components hand-roll instead. Order by payoff:

1. **Buttons (~13 live one-offs)** — `.sp-cast`/`.sp-trash` (spells),
   `.fvtt-atk`/`.wstat`/`.kind-seg` (AttacksTable),
   `.ft-title`/`.ft-chev`/`.ft-del`/`.osc-feat-add` (Abilities),
   `.osc-lang-go`/`.osc-lang-x`, `.osc-tb-btn` (Topbar),
   `.osc-tab`/`.osc-htab`/`.osc-botbtn` (shell), `.osc-link`, `.osc-inv-equip`.
   - Add a missing **`IconButton`** primitive; fold the ~7 icon-only buttons in.
   - Map the rest to canonical `Button` variants (`primary / ghost / danger / link`).
2. **Headings (3 systems)** — `.section-title` (most), modal `.ttl`, ad-hoc
   `.osc-inv-sec-title` / `.osc-spellhead`. Route all through `<SectionTitle>`,
   including the modal head.
3. **Tags / pills** — `.fvtt-tag`, `.osc-inv-tag`, `.ft-tag`, `.osc-lang`, ability
   mod-pill `.am`, `.osc-inv-count` all reinvent `.tag`. Collapse into `<Tag>`
   variants (+ a count/pill variant).
4. *(optional, deeper)* **Stat rows** — `.fvtt-save` / `.fvtt-skill` / `.osc-weapon`
   / `.osc-spell` are near-duplicate grids; factor a shared `stat-row` pattern.

## Phase 3 — Guardrails

- **Stylelint**: forbid hardcoded px `font-size` / hex colors in `styles/*.scss`
  (allow in `vellum/`).
- **ESLint**: flag `style={{}}` with literal color/px (exempt dynamic
  width/transform).
- **CLAUDE.md** note: reach for `ui/` primitives before writing a new `.osc-*` class.

---

## Execution & verification split (cloud vs local)

The dev server is **Vite-as-origin**: the `foundry-vtt-react/vite` plugin runs Vite
on `:30001`, serves the React bundle directly (HMR), and proxies everything else +
`/socket.io` to Foundry at `http://localhost:30000`. A cloud/Codespaces Vite cannot
reach a *local* Foundry through that proxy (`localhost` = the container, not your
laptop) without tunneling Foundry out and overriding `foundryUrl` — workable but
sluggish.

That doesn't block this work:

- **Cloud (Claude Code web)** — do the full refactor + automated checks headless:
  `pnpm build && pnpm lint && pnpm test`. No Foundry needed.
- **Local** — pull the branch, `pnpm dev`, eyeball the running sheet for visual
  sign-off (the one step that wants live Foundry).

## Suggested sequencing

Phase 1 first (fast, unambiguous; start with `components.css`) → checkpoint →
Phase 2 buttons → headings → tags → Phase 3. Verify each phase with
`pnpm build && pnpm lint && pnpm test`; visual QA locally after Phase 1 and Phase 2.
