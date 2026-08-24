# Alumas v29 — E2E & API Contracts

## Yeni kalite katmanı
- Playwright Chromium E2E testleri
- Gerçek PostgreSQL üzerinde kayıt, ölçüm, randevu ve kurum dizini akışları
- Zod tabanlı giriş şemaları
- Standart hata envelope: `{ ok:false, error, code, details? }`
- Başarılı yeni mutasyonlarda `{ ok:true, data }`
- GitHub Actions E2E workflow ve Playwright raporu

## Yerel E2E
```bash
npm install
npm run test:e2e:install
TEST_DATABASE_URL=postgresql://... npm run test:e2e:prepare
npm run test:e2e
```

Mevcut istemcilerle uyumluluk için `error` alanı string olarak korunur; `code` makine tarafından işlenebilir hata sınıfıdır.
