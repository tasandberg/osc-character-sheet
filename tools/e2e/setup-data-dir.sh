#!/usr/bin/env bash
#
# Assembles a Foundry /data dir for the osc-character-sheet E2E run: an OSE system
# release, the Classic Fantasy Compendium content module, the freshly-built
# osc-character-sheet module, and a bare "e2e" world fixture. Foundry itself and the license are handled by the felddy container at
# boot, not here.
#
# Usage: [OSE_VERSION=<tag>] [FOUNDRY_VERSION=<major>] setup-data-dir.sh <data-dir> <repo-root>
#        (repo-root/dist must be built)
set -euo pipefail

DATA_DIR="${1:?usage: setup-data-dir.sh <data-dir> <repo-root>}"
REPO="${2:?usage: setup-data-dir.sh <data-dir> <repo-root>}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# NecroticGnome OSE release tag, and the Foundry major the data dir is for.
OSE_VERSION="${OSE_VERSION:-2.2.2}"
FOUNDRY_VERSION="${FOUNDRY_VERSION:-14}"
OSE_ZIP="https://github.com/NecroticGnome/ose-foundry-core/releases/download/${OSE_VERSION}/system.zip"
CONTENT_TGZ="https://github.com/NecroticGnome/ose-foundry-content/archive/refs/heads/main.tar.gz"

SYS_DIR="$DATA_DIR/Data/systems/ose"
CONTENT_DIR="$DATA_DIR/Data/modules/classicfantasycompendium"
MOD_DIR="$DATA_DIR/Data/modules/osc-character-sheet"
WORLD_DIR="$DATA_DIR/Data/worlds/e2e"

echo "==> Preparing data dir at $DATA_DIR"
mkdir -p "$SYS_DIR" "$CONTENT_DIR" "$MOD_DIR" "$WORLD_DIR" "$DATA_DIR/container_cache"

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
# Masquerade: an OSE release not yet verified on this Foundry major gets its verified
# bumped (CI-only) so Foundry won't gate the world on system compat.
if (( ${FOUNDRY_VERSION%%.*} > $(jq -r '.compatibility.verified | split(".")[0]' "$SYS_DIR/system.json") )); then
  jq --arg v "$FOUNDRY_VERSION" '.compatibility.verified = $v | .compatibility.maximum = $v' \
    "$SYS_DIR/system.json" > "$SYS_DIR/system.json.tmp" && mv "$SYS_DIR/system.json.tmp" "$SYS_DIR/system.json"
fi
[[ "$(jq -r '.id' "$SYS_DIR/system.json")" == "ose" ]] || { echo "ERROR: OSE system id is not 'ose'." >&2; exit 1; }

# --- Classic Fantasy Compendium (main HEAD, compiled packs committed) --------
echo "==> Downloading Classic Fantasy Compendium"
curl -fsSL "$CONTENT_TGZ" -o "$TMP/content.tgz"
mkdir -p "$TMP/content"
tar -xzf "$TMP/content.tgz" -C "$TMP/content" --strip-components=1 --exclude=node_modules
rm -rf "$CONTENT_DIR"
mkdir -p "$CONTENT_DIR"
cp -R "$TMP/content/." "$CONTENT_DIR/"
jq --arg v "$FOUNDRY_VERSION" '.version = "0.0.0-e2e" | .compatibility.verified = $v' \
  "$CONTENT_DIR/module.json" > "$CONTENT_DIR/module.json.tmp" && mv "$CONTENT_DIR/module.json.tmp" "$CONTENT_DIR/module.json"

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
jq --arg v "$FOUNDRY_VERSION" '.coreVersion = $v | .compatibility.minimum = $v | .compatibility.verified = $v' \
  "$HERE/fixtures/world/world.json" > "$WORLD_DIR/world.json"

echo "==> Data dir ready:"
echo "    system:  $SYS_DIR  ($(jq -r '.id + " " + .version + " (verified " + .compatibility.verified + ")"' "$SYS_DIR/system.json"))"
echo "    content: $CONTENT_DIR  ($(jq -r '.id + " " + .version' "$CONTENT_DIR/module.json"))"
echo "    module:  $MOD_DIR  ($(jq -r '.id + " " + .version' "$MOD_DIR/module.json"))"
echo "    world:   $WORLD_DIR (system $(jq -r '.system + ", core " + .coreVersion' "$WORLD_DIR/world.json"))"
