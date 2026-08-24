# Alumas v32 — Deployment Packaging

## Temel kural
Staging ve production aynı container image digest'ini kullanır. Production için yeniden build yapılmaz.

## Image
```bash
docker build --build-arg APP_VERSION=0.32.0 --build-arg BUILD_SHA=$GIT_SHA -t ghcr.io/alumas/app:0.32.0-$GIT_SHA .
docker push ghcr.io/alumas/app:0.32.0-$GIT_SHA
# Registry'den sha256 digest alın ve immutable ref kullanın.
```

## Staging
```bash
ALUMAS_IMAGE='ghcr.io/alumas/app@sha256:...' docker compose -f deploy/staging.compose.yml --env-file .env.staging up -d
```

## Production
Yalnız staging'de doğrulanan aynı digest: 
```bash
ALUMAS_IMAGE='ghcr.io/alumas/app@sha256:...' docker compose -f deploy/production.compose.yml --env-file .env.production up -d
```

## Rollback
Önce DB migration uyumluluğu gözden geçirilir. Sonra `PREVIOUS_IMAGE_REF` ile rollback artifact oluşturulur.
