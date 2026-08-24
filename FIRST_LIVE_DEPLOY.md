# Alumas v34 — First Live Staging Deploy

Bu paket gerçek sunucu/domain bilgisi olmadan deploy yapmaz. Ama ilk staging yayını için gerekli sunucu tarafı akışı hazırlar.

## 1. Sunucu
Önerilen başlangıç: Ubuntu 24.04 LTS, 2 vCPU, 4 GB RAM, 40+ GB SSD.

```bash
sudo bash scripts/bootstrap-staging-host.sh
bash scripts/host-preflight.sh
```

## 2. DNS
`staging.alumas...` A/AAAA kaydını sunucu IP'sine yönlendir. DNS çözülmeden Caddy TLS başlatma.

## 3. Secrets
Sunucuda `/opt/alumas/staging/.env.staging` oluştur ve `chmod 600` yap. Git'e yükleme.

Zorunlu minimum: `DATABASE_URL`, `POSTGRES_PASSWORD`, `APP_URL`, `STAGING_DOMAIN`, `STAGING_BASE_URL`, `APP_VERSION`, `BUILD_SHA`, `RELEASE_CHANNEL=staging`, `ALUMAS_IMAGE` (sha256 digest), auth/security salt'ları.

## 4. Registry
Sunucuyu image registry'ye login et. GitHub Container Registry private ise read-only token kullan.

## 5. İlk deploy
GitHub Actions → **Deploy Staging** → immutable `image_ref` + sürüm gir.

Manuel alternatif:
```bash
cd /opt/alumas/staging/current
bash scripts/remote-staging-deploy.sh
```

Deploy sırası: DB → predeploy backup → image pull → migration → app → proxy/TLS → smoke.

## 6. Rollback
Yalnız image rollback otomatikleşmiştir; schema rollback değildir.
```bash
ROLLBACK_CONFIRM=ROLLBACK_STAGING bash scripts/remote-staging-rollback.sh
```
Migration kaynaklı geri dönüşte `BACKUP_POLICY.md` ve `INCIDENT_RUNBOOK.md` izlenir.
