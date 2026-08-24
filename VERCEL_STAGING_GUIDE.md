# Vercel Staging Guide

Alumas v42 Vercel staging için hazırlanmıştır.

## Önemli
Vercel serverless filesystem kalıcı kullanıcı dosyası deposu olarak kullanılmamalıdır.
Bu nedenle belge/sağlık dosyaları için `STORAGE_DRIVER=s3` ve S3-compatible storage bağlayın.

## Build
`postinstall` sırasında Prisma Client üretilir.
Vercel build komutu normal `npm run build` olabilir.

## Database
PostgreSQL `DATABASE_URL` gerekir.
İlk staging migration ayrı bir güvenli adım olarak çalıştırılmalıdır:
`npm run db:migrate:deploy`

## İlk deploy öncesi
`npm run v42:predeploy`
`npm run typecheck`
`npm run test`
`npm run build`

## İlk canlı test
- `/api/healthcheck`
- `/api/readiness`
- `/register`
- `/login`
- `/health/cycle`
- `/appointments`
- `/onboarding/doctor`
- `/business/apply`
- `/agency/apply`
- `/nearby`
