#!/usr/bin/env bash
set -euo pipefail

cd "${SUPERSET_WORKSPACE_PATH:-$PWD}"
WS="$(pwd -P)"

[ -f .superset/.dev-port ] || exit 0
PORT="$(cat .superset/.dev-port)"
[ -n "$PORT" ] || exit 0

owned_pids() {
  local pid cwd
  for pid in $(lsof -ti "tcp:$PORT" -sTCP:LISTEN 2>/dev/null || true); do
    cwd="$(lsof -a -d cwd -p "$pid" -Fn 2>/dev/null | sed -n 's/^n//p' | head -1)"
    case "$cwd" in "$WS"*) echo "$pid" ;; esac
  done
}

PIDS="$(owned_pids)"
if [ -n "$PIDS" ]; then
  echo "stopping dev server on :$PORT ($PIDS)"
  # shellcheck disable=SC2086
  kill $PIDS 2>/dev/null || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    [ -n "$(owned_pids)" ] || break
    sleep 0.5
  done
  REMAINING="$(owned_pids)"
  if [ -n "$REMAINING" ]; then
    # shellcheck disable=SC2086
    kill -9 $REMAINING 2>/dev/null || true
  fi
fi
