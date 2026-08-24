# Alumas v31 Release Candidate Checklist

## Code & database
- [ ] `npm install` temiz ortamda tamamlandı
- [ ] `npm run db:generate`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run test:e2e`
- [ ] `npm run build`
- [ ] `npm run security:check`
- [ ] `npm run v31:check`
- [ ] Staging DB için `npm run db:migration:gate`
- [ ] Production DB için migration status ayrıca doğrulandı

## Secrets / integrations
- [ ] SMS production sağlayıcısı doğrulandı
- [ ] FCM/APNs doğrulandı
- [ ] Private storage erişimi doğrulandı
- [ ] Mapbox anahtarları doğrulandı
- [ ] Video provider doğrulandı
- [ ] Sentry DSN doğrulandı

## Product smoke
- [ ] Hasta kayıt/giriş
- [ ] Doktor giriş ve müsaitlik
- [ ] Randevu oluştur/iptal/ertele
- [ ] Mesaj/bildirim
- [ ] Sağlık ölçümü
- [ ] Kurum başvuru/admin onayı
- [ ] Eczane/nöbetçi/harita
- [ ] Aile erişimi
- [ ] PDF rapor
- [ ] Hesap silme / veri dışa aktarma

## Release controls
- [ ] `APP_VERSION` paket sürümüyle aynı
- [ ] `BUILD_SHA` commit SHA
- [ ] `RELEASE_CHANNEL=rc` staging için
- [ ] Feature flags gözden geçirildi
- [ ] `MAINTENANCE_MODE=false`
- [ ] Backup alındı ve doğrulandı
- [ ] Rollback sürümü belirlendi
