#!/usr/bin/env bash
set -euo pipefail
ROOT=${ALUMAS_DEPLOY_ROOT:-/opt/alumas/staging}
ENV_FILE=${ALUMAS_ENV_FILE:-$ROOT/.env.staging}
PREV=$ROOT/state/previous-release.env
[[ -f "$PREV" ]] || { echo "NO-GO: previous-release.env yok"; exit 2; }
set -a; source "$ENV_FILE"; source "$PREV"; set +a
[[ "${ALUMAS_IMAGE:-}" == *@sha256:* ]] || { echo "NO-GO: previous image immutable digest değil"; exit 2; }
[[ "${ROLLBACK_CONFIRM:-}" == "ROLLBACK_STAGING" ]] || { echo "NO-GO: ROLLBACK_CONFIRM=ROLLBACK_STAGING gerekli"; exit 2; }
compose=$ROOT/current/deploy/staging.compose.yml
proxy=$ROOT/current/deploy/staging.proxy.compose.yml
# Schema rollback is intentionally NOT automatic. App image rollback only.
docker compose --env-file "$ENV_FILE" -f "$compose" pull app
docker compose --env-file "$ENV_FILE" -f "$compose" up -d --no-deps app
[[ "${STAGING_ENABLE_PROXY:-1}" == "1" ]] && docker compose --env-file "$ENV_FILE" -f "$compose" -f "$proxy" up -d proxy
base=${STAGING_BASE_URL:-https://$STAGING_DOMAIN}
for i in {1..20}; do curl -fsS "$base/api/readiness" >/dev/null && break; sleep 3; done
curl -fsS "$base/api/readiness" >/dev/null
echo "ROLLBACK IMAGE COMPLETE: $ALUMAS_IMAGE"
echo "NOT: Veritabanı migration geri alınmadı. Gerekirse BACKUP_POLICY.md prosedürünü izleyin."
