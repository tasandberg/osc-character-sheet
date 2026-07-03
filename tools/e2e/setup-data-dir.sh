#!/usr/bin/env bash
#
# Assembles a Foundry /data dir for the osc-character-sheet E2E run: the pinned OSE
# system release, the freshly-built osc-character-sheet module, and a bare "e2e" world
# fixture. Foundry itself and the license are handled by the felddy container at
# boot, not here.
#
# Usage: setup-data-dir.sh <data-dir> <repo-root>   (repo-root/dist must be built)
set -euo pipefail

DATA_DIR="${1:?usage: setup-data-dir.sh <data-dir> <repo-root>}"
REPO="${2:?usage: setup-data-dir.sh <data-dir> <repo-root>}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Pinned NecroticGnome OSE release. No v14-verified OSE exists yet, so we rewrite
# system.json compatibility.verified -> "14" below (CI-only) to clear v14 gating.
OSE_VERSION="${OSE_VERSION:-2.2.2}"
OSE_ZIP="https://github.com/NecroticGnome/ose-foundry-core/releases/download/${OSE_VERSION}/system.zip"

SYS_DIR="$DATA_DIR/Data/systems/ose"
MOD_DIR="$DATA_DIR/Data/modules/osc-character-sheet"
WORLD_DIR="$DATA_DIR/Data/worlds/e2e"

echo "==> Preparing data dir at $DATA_DIR"
mkdir -p "$SYS_DIR" "$MOD_DIR" "$WORLD_DIR" "$DATA_DIR/container_cache"

# --- OSE system (pinned release) -------------------------------------------
echo "==> Downloading OSE system $OSE_VERSION"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
curl -fsSL "$OSE_ZIP" -o "$TMP/ose.zip"
rm -rf "$SYS_DIR"
mkdir -p "$SYS_DIR"
# Release zip is flat (system.json/template.json/dist at root); may also be nested.
unzip -oq "$TMP/ose.zip" -d "$TMP/ose"
if [[ -f "$TMP/ose/system.json" ]]; then
  cp -R "$TMP/ose/." "$SYS_DIR/"
else
  SUB="$(find "$TMP/ose" -maxdepth 2 -name system.json -print -quit)"
  [[ -n "$SUB" ]] || { echo "ERROR: system.json missing in OSE zip." >&2; exit 1; }
  cp -R "$(dirname "$SUB")/." "$SYS_DIR/"
fi
# v14 masquerade: bump verified so Foundry v14 won't gate the world on system compat.
jq '.compatibility.verified = "14" | .compatibility.maximum = "14"' \
  "$SYS_DIR/system.json" > "$SYS_DIR/system.json.tmp" && mv "$SYS_DIR/system.json.tmp" "$SYS_DIR/system.json"
[[ "$(jq -r '.id' "$SYS_DIR/system.json")" == "ose" ]] || { echo "ERROR: OSE system id is not 'ose'." >&2; exit 1; }

# --- osc-character-sheet module (fresh build) ------------------------------------
echo "==> Installing osc-character-sheet module from build output"
[[ -f "$REPO/dist/main.js" ]] || { echo "ERROR: $REPO/dist/main.js not found -- run 'pnpm build' first." >&2; exit 1; }
rm -rf "$MOD_DIR"
mkdir -p "$MOD_DIR"
cp "$REPO/module.json" "$MOD_DIR/module.json"
cp -R "$REPO/dist" "$MOD_DIR/dist"
[[ -d "$REPO/lang" ]] && cp -R "$REPO/lang" "$MOD_DIR/lang"

# --- world fixture ----------------------------------------------------------
echo "==> Installing minimal world fixture (e2e)"
cp "$HERE/fixtures/world/world.json" "$WORLD_DIR/world.json"

echo "==> Data dir ready:"
echo "    system:  $SYS_DIR  ($(jq -r '.id + " " + .version + " (verified " + .compatibility.verified + ")"' "$SYS_DIR/system.json"))"
echo "    module:  $MOD_DIR  ($(jq -r '.id + " " + .version' "$MOD_DIR/module.json"))"
echo "    world:   $WORLD_DIR (system $(jq -r '.system' "$WORLD_DIR/world.json"))"
