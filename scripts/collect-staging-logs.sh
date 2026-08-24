#!/usr/bin/env bash
set -euo pipefail
ROOT=${ALUMAS_DEPLOY_ROOT:-/opt/alumas/staging}
ENV_FILE=${ALUMAS_ENV_FILE:-$ROOT/.env.staging}
OUT=${1:-$ROOT/logs/staging-$(date -u +%Y%m%dT%H%M%SZ).log}
mkdir -p "$(dirname "$OUT")"
{
  echo "# Alumas staging diagnostics $(date -u +%FT%TZ)"
  docker version 2>&1 || true
  docker compose version 2>&1 || true
  docker compose --env-file "$ENV_FILE" -f "$ROOT/current/deploy/staging.compose.yml" ps 2>&1 || true
  docker compose --env-file "$ENV_FILE" -f "$ROOT/current/deploy/staging.compose.yml" logs --since=2h --no-color app db 2>&1 || true
} > "$OUT"
chmod 600 "$OUT" || true
echo "$OUT"
