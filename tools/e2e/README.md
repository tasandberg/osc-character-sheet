# osc-character-sheet E2E suite

Playwright user-click E2E tests that drive the osc-character-sheet character sheet in a
real Foundry VTT server (OSE system + the built module), once per Foundry × OSE pair. The GitHub Actions
workflow at `.github/workflows/e2e.yml` boots Foundry and wires these together;
everything here also runs locally against a scratch Foundry container.

## In CI (maintainer setup)

The workflow needs two repository secrets — a foundryvtt.com account that holds a
license (Settings → Secrets and variables → Actions):

| Secret | Purpose |
| --- | --- |
| `FOUNDRY_USERNAME` | account email/username; felddy uses it to download Foundry and fetch the license at boot |
| `FOUNDRY_PASSWORD` | account password |

The job fails fast with a clear message if either is missing. One license = one
concurrent server, so the workflow's `concurrency` group serializes runs and the matrix
legs run one at a time.

### Foundry / OSE versions

The matrix is `FOUNDRY_VERSIONS` × `OSE_VERSIONS` at the top of
`.github/workflows/e2e.yml`, one entry per line — add or delete a line to add or drop a
version. Foundry entries are felddy image tags (`13`, `14`). OSE entries are a release
tag (`3.0.1`) or `latest-release` / `latest-prerelease`, resolved from GitHub each run
(`latest-prerelease` falls back to the stable release when nothing newer exists). Each
leg reports as `e2e (v<foundry>, OSE <version>)`; the required `e2e` check rolls them up. Same-repo
PRs run automatically; fork PRs need a maintainer's `safe-to-test` label.

## Pieces

| File | Role |
| --- | --- |
| `setup-data-dir.sh` | Assembles a Foundry `/data` dir: the OSE release `OSE_VERSION` (default 2.2.2) for Foundry major `FOUNDRY_VERSION` (default 14; `compatibility.verified` bumped when the release predates it), the freshly-built osc-character-sheet module (`module.json` + `dist` + `lang`), and the minimal `e2e` world fixture. |
| `activate-world.mjs` | First-boot activation: `--phase eula` accepts the EULA (generates the host-bound license signature), the caller restarts the container so felddy's `FOUNDRY_WORLD` auto-launches the world, `--phase await` polls `/api/status` until active. |
| `global-setup.ts` | Joins as Gamemaster, enables the osc-character-sheet module + reloads, then seeds one passwordless GM (`E2E GM <slot>`) and one passwordless OBSERVER player (`E2E Observer <slot>`) per parallel slot. Runs once before the specs. |
| `helpers.ts` | `joinAsUser` / `joinAsGM`, `openCharacterSheet` (wide layout unless given a `width`), chat/item readers, and the layout primitives `boxesOf` / `rowsOf`. |
| `fixtures.ts` | Worker-scoped `gamePage` / `observerPage` (this slot's GM and view-only player, each its own browser context), plus the test-scoped `fighter` actor. |
| `specs/*.spec.ts` | One spec per core flow: smoke, tabs, ability, save, attack, equip, coin, `readonly` (non-owner view-only sheet), and `surfaces` (per-tab feature surfaces + layout invariants). |

### Parallel isolation

All workers share one Foundry world (one license, one server), so isolation is per test:

- **Per test:** the `fighter` fixture creates its own actor (weapon/armor/coins, pinned to
  the OSC sheet, view-only for this slot's observer) and deletes it afterwards, along with
  any hotbar macro OSE named after its weapon. The weapon name is tagged per test because
  macros are world-global.
- **Per parallel slot:** its own GM and observer user. Two sessions of one Foundry *user*
  share that user's hotbar, assigned character and flags, so sharing `Gamemaster` across
  workers is what made the earlier 2-worker trial flake.

With that, no spec needs to run serially: `playwright.config.ts` sets `fullyParallel: true`
and `workers: 3`.

### Read-only (non-owner) coverage

`specs/readonly.spec.ts` drives the sheet as `observerPage` and asserts every tab
exposes no edit affordances: HP steppers, editable portrait, Edit modal, and
per-tab edit controls (abilities/notes), plus the inventory tab — no equip
toggles, no draggable rows/tray tiles/coin grips, disabled coin qty, and a
view-only item context menu (only "View Item").

### Layout coverage (the visual gate)

`specs/surfaces.spec.ts` walks every tab, asserts each one's feature surface renders,
and adds cheap geometry invariants on top — because presence is blind to the failure
that motivated this: a stylesheet deletion left ability plaques and saves stacking
one-per-row and a weapon icon at full width, all still perfectly visible, with every
gate green.

The invariants use `boxesOf` / `rowsOf` from `helpers.ts` and assert relationships —
row counts, share-of-parent widths — never pixel values, so an intentional redesign
passes and a collapse fails. **No `toHaveScreenshot`**: CI renders under software
WebGL and a dev machine does not, so a pixel baseline would be flaky across
environments.

When adding one, verify it can fail: delete the styling it guards, confirm red, then
restore. Two candidates were measured against a stripped stylesheet and came out too
close to the healthy value to keep — see the exploration note in the spec.

## Running locally

```sh
# 1. Build the module at the repo root.
pnpm install && pnpm build

# 2. Assemble a scratch data dir.
DATA=/tmp/osc-e2e-data
OSE_VERSION=3.0.1 FOUNDRY_VERSION=14 tools/e2e/setup-data-dir.sh "$DATA" "$PWD"

# 3. Boot Foundry (felddy). Needs foundryvtt.com creds; pick a free port.
docker run -d --name osc-e2e -p 30000:30000 -v "$DATA:/data" \
  -e FOUNDRY_USERNAME=... -e FOUNDRY_PASSWORD=... \
  -e CONTAINER_CACHE=/data/container_cache -e FOUNDRY_WORLD=e2e \
  felddy/foundryvtt:14

# 4. Once healthy, activate and run.
cd tools/e2e
npm install && npx playwright install chromium
node activate-world.mjs --phase eula
docker stop -t 30 osc-e2e
rm -rf "$DATA/Config/options.json.lock"   # Foundry always leaves this behind
docker start osc-e2e
node activate-world.mjs --phase await
npx playwright test
```

`FOUNDRY_URL` overrides the server URL (default `http://localhost:30000`).
