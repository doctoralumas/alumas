# Alumas v7 — Staging ve mağaza beta yayını

## 1. Staging
1. `.env.staging.example` dosyasını `.env.staging` olarak kopyala ve gerçek secrets ekle.
2. `POSTGRES_PASSWORD` değerini shell/hosting secret olarak tanımla.
3. `npm run env:validate:staging` ile konfigürasyonu kontrol et.
4. `docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build`.
5. Reverse proxy/TLS ile `https://staging.alumas.com` adresine bağla.
6. `ALUMAS_BASE_URL=https://staging.alumas.com npm run staging:preflight`.

## 2. Firebase/APNs
- Firebase projesinde iOS ve Android uygulamalarını `com.alumas.health` kimliğiyle kaydet.
- Android `google-services.json`, iOS `GoogleService-Info.plist` dosyalarını native projelere ekle.
- iOS için Apple Developer APNs authentication key'i Firebase Cloud Messaging ayarlarına yükle.
- Xcode'da Push Notifications ve gerekli Background Modes yeteneklerini etkinleştir.

## 3. iOS / TestFlight
- App Store Connect'te Alumas uygulama kaydı ve benzersiz bundle ID oluştur.
- Güncel App Store yükleme gereksinimine uygun Xcode/SDK kullan.
- `npm run mobile:init && npm run mobile:sync && npm run mobile:open:ios`.
- Signing & Capabilities: Team, HealthKit, Push Notifications ve kullanılan diğer yetenekleri doğrula.
- Version/build numarasını artır, fiziksel cihazda giriş, OTP, randevu, push ve HealthKit akışlarını test et.
- Xcode Archive > Distribute App > App Store Connect ile build yükle.
- TestFlight'ta beta açıklaması, test edilecek özellikler ve geri bildirim e-postasını gir; internal tester grubuna build'i ata.

## 4. Android / Internal Testing
- Play Console'da uygulama kaydı oluştur ve applicationId `com.alumas.health` ile eşleştir.
- `npm run mobile:init && npm run mobile:sync && npm run mobile:open:android`.
- Release signing keystore oluştur ve güvenli CI/secret store'da sakla; repoya koyma.
- Health Connect izinleriyle Play Console Health apps/data safety beyanlarının birebir eşleştiğini kontrol et.
- Signed Android App Bundle (`.aab`) üret ve Internal Testing track'e yükle.
- Tester Google hesaplarını listeye ekle ve opt-in linkiyle test et.

## 5. Yayın kapısı
Aşağıdakiler geçmeden production mağaza incelemesine gönderme:
- `npm run typecheck`
- `npm run build`
- `npm run release:check`
- staging preflight başarılı
- fiziksel iPhone ve Android cihaz testi
- hesap silme ve veri dışa aktarma testi
- push/OTP testleri
- Health izin reddi/geri alma testleri
- privacy policy ve KVKK metinleri hukuk kontrolünden geçmiş
- App Store privacy labels ve Google Play Data safety formları gerçek veri akışıyla eşleşiyor
