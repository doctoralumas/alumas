#!/usr/bin/env bash
set -euo pipefail
fail(){ echo "NO-GO: $*" >&2; exit 2; }
warn(){ echo "WARN: $*" >&2; }
[[ "$(uname -s)" == "Linux" ]] || fail "Linux sunucu gerekli"
command -v docker >/dev/null || fail "Docker kurulu değil"
docker compose version >/dev/null 2>&1 || fail "Docker Compose plugin gerekli"
command -v curl >/dev/null || fail "curl gerekli"
command -v openssl >/dev/null || warn "openssl yok; TLS manuel doğrulanmalı"
free_mb=$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)
(( free_mb >= 1800 )) || warn "RAM ${free_mb}MB; staging için >= 2GB önerilir"
disk_gb=$(df -Pk / | awk 'NR==2{print int($4/1024/1024)}')
(( disk_gb >= 15 )) || warn "Boş disk ${disk_gb}GB; >= 15GB önerilir"
if command -v ss >/dev/null; then
  ss -ltn | grep -qE ':(80|443)\s' && warn "80/443 portlarından biri kullanımda; Caddy ile çakışma olabilir"
fi
if [[ -f .env.staging ]]; then
  mode=$(stat -c '%a' .env.staging 2>/dev/null || true)
  [[ "$mode" == "600" || "$mode" == "400" ]] || warn ".env.staging izinleri $mode; chmod 600 önerilir"
fi
echo "HOST PREFLIGHT: GO ✓"
