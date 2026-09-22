#!/usr/bin/env bash
set -euo pipefail

cd "${SUPERSET_WORKSPACE_PATH:-$PWD}"
ROOT="${SUPERSET_ROOT_PATH:-}"

if [ -n "$ROOT" ] && [ -d "$ROOT" ] && [ "$ROOT" != "$PWD" ]; then
  for f in .env .env.local foundry-config.json vite.config.local.json .mailmap .claude/settings.json; do
    if [ -e "$ROOT/$f" ] && [ ! -e "$f" ]; then
      mkdir -p "$(dirname "$f")"
      cp -R "$ROOT/$f" "$f"
      echo "copied $f"
    fi
  done

  if [ -d "$ROOT/foundry" ] && [ ! -e foundry ]; then
    cp -R "$ROOT/foundry" foundry
    echo "copied foundry/ (Foundry type roots)"
  fi
fi

if [ ! -e foundry ] && [ -f foundry-config.json ]; then
  pnpm link-foundry || echo "link-foundry failed; @client/@common types will be unresolved"
fi

pnpm install --frozen-lockfile || pnpm install

echo "setup complete — click Run to start the dev server"
