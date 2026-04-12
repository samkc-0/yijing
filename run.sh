#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BIN="$ROOT_DIR/bin/yijing"

if [ ! -x "$BIN" ]; then
  mkdir -p "$ROOT_DIR/bin"
  go build -o "$BIN" "$ROOT_DIR"
fi

exec "$BIN"
