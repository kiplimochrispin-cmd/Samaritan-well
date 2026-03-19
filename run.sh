#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="/tmp/samaritan_dev.pid"
LOG_FILE="/tmp/samaritan_dev.log"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8080}"
URL="http://${HOST}:${PORT}"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node is not installed or not in PATH."
  exit 1
fi

if ! command -v firefox >/dev/null 2>&1; then
  echo "Error: firefox is not installed or not in PATH."
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "Error: curl is not installed or not in PATH."
  exit 1
fi

cd "$ROOT_DIR"

# If a previous PID exists, verify it still points to a running process.
if [[ -f "$PID_FILE" ]]; then
  old_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "${old_pid}" ]] && ! kill -0 "${old_pid}" >/dev/null 2>&1; then
    rm -f "$PID_FILE"
  fi
fi

# Start server only if endpoint is not already available.
if ! curl -sSf "$URL" >/dev/null 2>&1; then
  if [[ -f "$PID_FILE" ]]; then
    kill "$(cat "$PID_FILE")" >/dev/null 2>&1 || true
    rm -f "$PID_FILE"
  fi

  setsid env HOST="$HOST" PORT="$PORT" node server.js >"$LOG_FILE" 2>&1 < /dev/null &
  echo "$!" >"$PID_FILE"

  # Wait for server to become ready.
  for _ in {1..20}; do
    if curl -sSf "$URL" >/dev/null 2>&1; then
      break
    fi
    sleep 0.25
  done
fi

if ! curl -sSf "$URL" >/dev/null 2>&1; then
  echo "Error: server failed to start. Check $LOG_FILE"
  exit 1
fi

firefox --new-window "$URL" >/dev/null 2>&1 &

echo "Samaritan site is running at $URL"
echo "Server PID: $(cat "$PID_FILE" 2>/dev/null || echo unknown)"
echo "Log file: $LOG_FILE"
