#!/usr/bin/env bash
set -euo pipefail

cd "${SUPERSET_WORKSPACE_PATH:-$PWD}"
NAME="${SUPERSET_WORKSPACE_NAME:-$(basename "$PWD")}"

PORT="$(node .superset/pick-port.mjs "$NAME")"

printf '%s\n' "$PORT" > .superset/.dev-port
cat > .superset/ports.json <<JSON
{
  "ports": [
    { "port": $PORT, "label": "osc sheet dev — $NAME" }
  ]
}
JSON

echo "vite dev server on http://localhost:$PORT (Foundry proxied from :30000)"
exec pnpm dev --port "$PORT" --strictPort
