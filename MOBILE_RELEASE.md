# Alumas v5 — iOS / Android release setup

Bu proje Capacitor 8 tabanlı native kabuk kullanır. Next.js API rotaları ve PostgreSQL sunucuda çalıştığı için mobil kabuk production'da `CAPACITOR_SERVER_URL` ile yayınlanmış HTTPS Alumas adresini açar. `native-web/` yalnızca sunucu URL'si ayarlanmamışsa güvenli fallback ekranıdır.

## 1) Native projeleri oluştur

```bash
npm install
cp .env.example .env
# .env içinde CAPACITOR_SERVER_URL=https://app.ornek-alumas-domain.com
npm run mobile:init
npm run mobile:assets
```

Sonra:

```bash
npm run mobile:open:ios
npm run mobile:open:android
```

Capacitor 8 paketleri `@capacitor/core`, `@capacitor/ios`, `@capacitor/android`; push için resmi `@capacitor/push-notifications`; sağlık için `@capgo/capacitor-health` kullanılır.

## 2) iOS — HealthKit

Xcode'da `ios/App/App.xcworkspace` açın.

1. Target **App → Signing & Capabilities → + Capability → HealthKit** ekleyin.
2. `Info.plist` içine şu açıklamaları ekleyin:

```xml
<key>NSHealthShareUsageDescription</key>
<string>Alumas, seçtiğiniz sağlık ölçümlerini kişisel sağlık görünümünüzde göstermek ve izin verdiğiniz uzmanlarla paylaşmak için okur.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>Alumas, yalnızca sizin açıkça kaydetmeyi seçtiğiniz sağlık verilerini Apple Health'e yazmak için izin ister.</string>
```

MVP şu anda HealthKit'e yazmıyor; `NSHealthUpdateUsageDescription` gelecekte yazma özelliği açılacaksa tutulmalıdır. Yazma özelliği hiç kullanılmayacaksa yayın öncesi gereksiz yetenek/izinleri kaldırın. Clinical Health Records yeteneğini açmayın.

## 3) Android — Health Connect

`android/app/src/main/AndroidManifest.xml` içinde yalnızca kullanılan okuma izinlerini beyan edin:

```xml
<uses-permission android:name="android.permission.health.READ_STEPS" />
<uses-permission android:name="android.permission.health.READ_HEART_RATE" />
<uses-permission android:name="android.permission.health.READ_WEIGHT" />
<uses-permission android:name="android.permission.health.READ_SLEEP" />
```

Google Play Console'daki Health apps declaration ile manifest izinleri birebir eşleşmelidir. Kullanıcı izinlerini uygulama içinden veri türü bazında seçer. Alumas v5 geçmişte yalnızca son 7 günü senkronize ettiği için `READ_HEALTH_DATA_HISTORY` istemez.

Health Connect gizlilik politikası için Android `strings.xml` içine yayınlanmış politika URL'nizi ekleyin:

```xml
<string name="health_connect_privacy_policy_url">https://YOUR_DOMAIN/privacy</string>
```

## 4) Push bildirimleri

### Android / FCM

1. Firebase projesinde Android app'i `com.alumas.health` package adıyla oluşturun.
2. `google-services.json` dosyasını `android/app/google-services.json` konumuna koyun.
3. Firebase/Capacitor yönergelerindeki Google Services Gradle yapılandırmasını tamamlayın.
4. `npm run mobile:sync` çalıştırın.

### iOS / APNs

1. Apple Developer'da App ID için **Push Notifications** capability açın.
2. Xcode Target → Signing & Capabilities içinde **Push Notifications** ekleyin.
3. APNs `.p8` anahtarını ve Key ID / Team ID bilgilerini yalnızca sunucu secret store'unda saklayın.
4. `@capacitor/push-notifications` kayıt tokenını Alumas `/api/push` endpoint'ine yollar.

`components/push-settings.tsx` native cihazda gerçek token kaydı yapar; web'de yalnızca demo token üretir. Sunucu tarafı teslimat worker'ı için `PushDevice.platform` alanı `ios` / `android` ayrımını korur.

## 5) App icon / splash

Kaynaklar:

- `resources/icon.svg`
- `resources/splash.svg`

Üretim:

```bash
npm run mobile:assets
npm run mobile:sync
```

Mağaza öncesi icon'u gerçek Alumas marka ikonuyla değiştirmek yeterlidir; aynı komut tüm platform boyutlarını yeniden üretir.

## 6) Güvenlik / mağaza kontrol listesi

- `CAPACITOR_SERVER_URL` production'da HTTPS olmalı; cleartext HTTP kullanmayın.
- Sağlık verisi izinleri minimum kapsamda tutulmalı.
- HealthKit / Health Connect'ten alınan sağlık verisini reklam profilleme amacıyla kullanmayın.
- Sağlık belgelerini local disk yerine şifreli object storage + imzalı URL + malware scan ile saklayın.
- KVKK aydınlatma/açık rıza sürümlerini ve sağlık kaydı erişim audit loglarını saklayın.
- Kullanıcı için hesap/veri silme ve veri dışa aktarma akışlarını mağaza başvurusundan önce tamamlayın.
- Push, OTP ve dosya API'lerinde rate limiting ekleyin.

## 7) Release komutları

```bash
npm run build
npm run typecheck
npm run mobile:sync
npm run mobile:open:ios
npm run mobile:open:android
```

Xcode'da Archive → App Store Connect; Android Studio'da signed Android App Bundle (`.aab`) üretin.
