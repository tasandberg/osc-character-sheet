# osc-character-sheet E2E suite

Playwright user-click E2E tests that drive the osc-character-sheet character sheet in a
real Foundry VTT **v14** server (OSE system + the built module). The GitHub Actions
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
concurrent server, so the workflow's `concurrency` group serializes runs. Same-repo
PRs run automatically; fork PRs need a maintainer's `safe-to-test` label.

## Pieces

| File | Role |
| --- | --- |
| `setup-data-dir.sh` | Assembles a Foundry `/data` dir: the pinned OSE release (`OSE_VERSION`, default 2.2.2; `compatibility.verified` bumped to `14` for CI), the freshly-built osc-character-sheet module (`module.json` + `dist` + `lang`), and the minimal `e2e` world fixture. |
| `activate-world.mjs` | First-boot activation: `--phase eula` accepts the EULA (generates the host-bound license signature), the caller restarts the container so felddy's `FOUNDRY_WORLD` auto-launches the world, `--phase await` polls `/api/status` until active. |
| `global-setup.ts` | Joins as Gamemaster, enables the osc-character-sheet module + reloads, seeds the `E2E Fighter` character (weapon/armor/coins) pinned to the OSC sheet, and seeds a passwordless `E2E Observer` PLAYER user with OBSERVER (view-only) permission on that actor. Runs once before the specs. |
| `helpers.ts` | `joinAsUser` / `joinAsGM`, `openCharacterSheet` (forces the wide layout), chat/item readers. |
| `fixtures.ts` | Worker-scoped `gamePage` (Gamemaster) and `observerPage` (the `E2E Observer` view-only player) — each its own browser context against the one shared server. |
| `specs/*.spec.ts` | One spec per core flow: smoke, tabs, ability, save, attack, equip, coin, and `readonly` (non-owner view-only sheet). |

### Read-only (non-owner) coverage

`specs/readonly.spec.ts` drives the sheet as `observerPage` and asserts every tab
exposes no edit affordances: HP steppers, editable portrait, Edit modal, and
per-tab edit controls (abilities/notes), plus the inventory tab — no equip
toggles, no draggable rows/tray tiles/coin grips, disabled coin qty, and a
view-only item context menu (only "View Item").

## Running locally

```sh
# 1. Build the module at the repo root.
pnpm install && pnpm build

# 2. Assemble a scratch data dir.
DATA=/tmp/osc-e2e-data
tools/e2e/setup-data-dir.sh "$DATA" "$PWD"

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
