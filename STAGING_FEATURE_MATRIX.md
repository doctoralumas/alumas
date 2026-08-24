# Alumas v42 — Staging Feature Matrix

## Gerçek uygulama + veritabanı akışı hazır
- E-posta/parola kayıt ve giriş
- Hasta profili
- Doktor onboarding ve doğrulama akışı
- Hastane / klinik / eczane başvuru ve yönetim
- Sağlık turizmi acente başvuru ve yönetim
- Randevu ve müsaitlik
- Tansiyon
- Kan şekeri
- Uyku
- Su takibi
- Kilo / boy
- İlaç yönetimi ve uyum kayıtları
- Regl / menstrual cycle takibi
- Laboratuvar kayıtları
- Radyoloji kayıtları
- Aşılar
- Sağlık kartı
- Aile profilleri ve erişim
- Evde sağlık talepleri
- Sağlık turizmi paket/acente verileri
- Sigorta dizini
- Bildirim kayıtları
- Audit ve admin panelleri

## Dış servis bağlanınca canlı olacak
- Google Places / Maps: API anahtarı gerekli
- SMS / telefon OTP: Twilio veya başka SMS sağlayıcısı gerekli
- Push notification: Firebase service account gerekli
- Görüntülü görüşme: Daily API anahtarı gerekli
- Özel dosya yükleme: Vercel'de S3-compatible storage gerekli
- Apple Health / Health Connect: yalnız native iOS/Android build üzerinde çalışır

## Demo/fallback davranışı bulunan alanlar
- VIDEO_PROVIDER boşsa `demo`
- SMS_PROVIDER boşsa `console`
- Web push cihaz tokenı gerçek browser push sağlayıcısı olmadan demo token kullanabilir
- Apple Health / Health Connect web üzerinde demo/uygunsuz olarak döner

## Staging GO kriteri
1. `DATABASE_URL` bağlı.
2. `npm install` sonrası `prisma generate` başarılı.
3. `npm run typecheck` başarılı.
4. `npm run build` başarılı.
5. Prisma migration uygulanmış.
6. Hasta kayıt/giriş testi başarılı.
7. Regl kaydı create/list/delete başarılı.
8. Randevu create/list/cancel başarılı.
9. Doktor, kurum ve acente onboarding testleri başarılı.
10. Google Places anahtarı eklenmişse yakındaki kurum/otel testi başarılı.
