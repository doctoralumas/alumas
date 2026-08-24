# Alumas v30 — Observability & Production Ops

## Observability
- Next.js 16 `proxy.ts` ile her isteğe `x-request-id`.
- JSON structured logging (`lib/observability.ts`).
- Ops metrics: `GET /api/ops/metrics` Bearer `METRICS_SECRET`.
- Admin 24 saat operasyon özeti ve filtrelenebilir audit dashboard.
- Opsiyonel Sentry: `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`. PII varsayılan kapalıdır.

## Önerilen env
```env
APP_ENV=staging
METRICS_SECRET=<long-random-secret>
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_TRACES_SAMPLE_RATE=0.05
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.05
BACKUP_DIR=/var/backups/alumas
```

## Backup
```bash
BACKUP_DATABASE_URL=postgresql://... npm run db:backup
npm run db:backup:verify -- backups/alumas-....dump
```
Backup'ın aynı makinede kalması yeterli değildir; şifreli ve ayrı bir storage lokasyonuna kopyalanmalıdır.

## Restore
Önce staging/restore test DB'sinde denenir:
```bash
RESTORE_DATABASE_URL=postgresql://... npm run db:restore -- backup.dump --confirm=RESTORE
```
Production restore normal deployment akışı değildir; incident prosedürü ve ikinci kişi onayı önerilir.
