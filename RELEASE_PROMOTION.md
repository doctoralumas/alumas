# Staging → Production Promotion

1. Aynı immutable build'i staging'e kur. Yeniden build etme.
2. `/api/version` ile `version` + `buildSha` doğrula.
3. `/api/readiness` 200 olmalı.
4. Migration gate ve E2E smoke testlerini çalıştır.
5. RC feature flag'lerini staging'de doğrula.
6. Production backup al ve verify et.
7. Gerekirse maintenance mode aç.
8. Production migration deploy et.
9. Aynı build SHA'yı production'a promote et.
10. Readiness, metrics, login, randevu ve kritik sağlık akışını smoke test et.
11. Maintenance mode'u kapat.
12. 30–60 dakika hata/latency/audit metriklerini izle.

## Rollback
- Uygulama rollback: önceki immutable image/build SHA.
- DB rollback: migration'ı körlemesine geri alma; ileri-düzeltme migration tercih edilir.
- Veri kaybı/bozulma varsa INCIDENT_RUNBOOK + BACKUP_POLICY uygulanır.
