#!/usr/bin/env bash
set -euo pipefail
ROOT=${ALUMAS_DEPLOY_ROOT:-/opt/alumas/staging}
ENV_FILE=${ALUMAS_ENV_FILE:-$ROOT/.env.staging}
COMPOSE=${ALUMAS_COMPOSE_FILE:-$ROOT/current/deploy/staging.compose.yml}
PROXY_COMPOSE=${ALUMAS_PROXY_COMPOSE_FILE:-$ROOT/current/deploy/staging.proxy.compose.yml}
STATE=$ROOT/state/current-release.env
PREV=$ROOT/state/previous-release.env
[[ -f "$ENV_FILE" ]] || { echo "NO-GO: $ENV_FILE yok"; exit 2; }
set -a; source "$ENV_FILE"; set +a
[[ "${RELEASE_CHANNEL:-}" == "staging" ]] || { echo "NO-GO: RELEASE_CHANNEL=staging gerekli"; exit 2; }
[[ "${ALUMAS_IMAGE:-}" == *@sha256:* ]] || { echo "NO-GO: immutable ALUMAS_IMAGE digest gerekli"; exit 2; }
[[ -n "${STAGING_DOMAIN:-}" && ! "$STAGING_DOMAIN" =~ (^|\.)app\.alumas\. ]] || { echo "NO-GO: staging domain gerekli"; exit 2; }
mkdir -p "$ROOT/state" "$ROOT/backups" "$ROOT/logs"
if [[ -f "$STATE" ]]; then cp "$STATE" "$PREV"; fi
printf 'ALUMAS_IMAGE=%q\nAPP_VERSION=%q\nBUILD_SHA=%q\nDEPLOYED_AT=%q\n' "$ALUMAS_IMAGE" "${APP_VERSION:-unknown}" "${BUILD_SHA:-unknown}" "$(date -u +%FT%TZ)" > "$STATE.pending"
# DB first; app is not started against an unmigrated schema.
docker compose --env-file "$ENV_FILE" -f "$COMPOSE" up -d db
for i in {1..30}; do docker compose --env-file "$ENV_FILE" -f "$COMPOSE" exec -T db pg_isready -U alumas -d alumas_staging >/dev/null 2>&1 && break; sleep 2; done
docker compose --env-file "$ENV_FILE" -f "$COMPOSE" exec -T db pg_isready -U alumas -d alumas_staging >/dev/null
# Pre-migration backup when pg_dump is available in DB container.
backup="$ROOT/backups/predeploy-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE" exec -T db pg_dump -U alumas alumas_staging | gzip -9 > "$backup"
[[ -s "$backup" ]] || { echo "NO-GO: predeploy backup boş"; exit 3; }
docker compose --env-file "$ENV_FILE" -f "$COMPOSE" pull app
docker compose --env-file "$ENV_FILE" -f "$COMPOSE" run --rm --no-deps app npx prisma migrate deploy
docker compose --env-file "$ENV_FILE" -f "$COMPOSE" up -d --remove-orphans app
if [[ "${STAGING_ENABLE_PROXY:-1}" == "1" ]]; then docker compose --env-file "$ENV_FILE" -f "$COMPOSE" -f "$PROXY_COMPOSE" up -d proxy; fi
base=${STAGING_BASE_URL:-https://$STAGING_DOMAIN}
for i in {1..30}; do if curl -fsS "$base/api/readiness" >/dev/null; then break; fi; sleep 3; done
curl -fsS "$base/api/readiness" >/dev/null
node "$ROOT/current/scripts/staging-smoke-v33.mjs"
mv "$STATE.pending" "$STATE"
echo "REMOTE STAGING DEPLOY: GO ✓ $ALUMAS_IMAGE"
