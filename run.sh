#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
IMAGE=${IMAGE:-yijing}
PORT=${PORT:-8088}
DOCKER=${DOCKER:-docker}

cd "$ROOT_DIR"

"$DOCKER" build -t "$IMAGE" .
exec "$DOCKER" run --rm -p "$PORT:8088" "$IMAGE"
