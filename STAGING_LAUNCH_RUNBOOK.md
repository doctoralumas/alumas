# İlk Staging Yayını — Tek Komut Runbook

## Ön koşullar
- `.env.staging` hazır
- `RELEASE_CHANNEL=staging`
- `STAGING_DOMAIN=staging.alumas.com` benzeri staging host
- `STAGING_BASE_URL=https://...`
- `ALUMAS_IMAGE=registry/...@sha256:...` immutable digest
- DNS A/AAAA kaydı çözülüyor
- Docker + Compose kurulu

## Önce dry-run
```bash
set -a; source .env.staging; set +a
STAGING_DRY_RUN=1 npm run staging:launch
```

## Gerçek launch
```bash
set -a; source .env.staging; set +a
STAGING_ENABLE_PROXY=1 npm run staging:launch
```

Komut sırasıyla DNS, secret matrix, GO/NO-GO, immutable image pull, compose up, Prisma migrate deploy ve HTTPS smoke test çalıştırır.

## Launch sonrası
- `/admin/release` ekranını kontrol et
- uptime monitorleri etkinleştir
- E2E testlerini staging URL’sine karşı çalıştır
- backup oluştur ve verify et
- release manifest + image digest’i sakla
