# Staging Host Security
- SSH parola girişini kapat; key-only kullan.
- Root SSH login kapalı olsun.
- Deploy kullanıcısına yalnız gereken Docker/uygulama izinlerini ver.
- UFW: 22 (tercihen sabit yönetim IP'leri), 80, 443. Postgres 5432 internete açılmaz.
- `.env.staging` chmod 600; secret'lar repo/artifact içine girmez.
- Docker JSON log rotation aktif.
- Günlük/haftalık DB backup retention politikasını `BACKUP_POLICY.md` ile uygula.
- Sunucu patch'lerini düzenli uygula.
- Staging'de gerçek hasta verisi kullanma; sentetik/test veri kullan.
