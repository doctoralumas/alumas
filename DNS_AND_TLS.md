# DNS & TLS Checklist

## Staging
1. `staging.alumas.com` (veya seçilen staging host) için A/AAAA kaydı oluştur.
2. DNS çözümünü `npm run staging:dns-check` ile doğrula.
3. Sunucuda 80/443 portlarının açık olduğundan emin ol.
4. Caddy reverse proxy kullanıyorsan `STAGING_ENABLE_PROXY=1` ile aç. Caddy DNS çözüldükten sonra ACME üzerinden TLS sertifikası alır.
5. `ALLOWED_ORIGINS=https://<staging-domain>` ve `APP_URL=https://<staging-domain>` aynı hostu kullanmalı.

## Production
Production DNS değişikliği yalnız release GO kararı sonrasında yapılmalı. İlk cutover öncesi TTL düşürme, rollback DNS hedefi ve önceki image digest’i kayıt altında tutulmalı.

## TLS NO-GO koşulları
- Sertifika host adıyla eşleşmiyor.
- HTTPS yönlendirmesi yok.
- `/api/readiness` HTTPS üzerinden 200 dönmüyor.
- HSTS/CSP security check başarısız.
