# Alumas v27 — Hardening

Bu sürüm yeni ürün özelliği eklemek yerine güvenlik ve yayın hazırlığına odaklanır.

- Login deneme throttling (15 dakikada hesap başına 8 başarısız deneme; IP başına 20)
- OTP tek-aktif-kod yaklaşımı ve kod başına en fazla 5 doğrulama denemesi
- Parola minimum 10 karakter + harf/rakam politikası
- API mutasyonlarında Origin kontrolü / CSRF risk azaltma (`ALLOWED_ORIGINS`)
- Güçlendirilmiş güvenlik header'ları (CSP, HSTS, COOP, no-sniff, frame deny)
- Oturum cookie priority=high ve süresi dolmuş session temizliği
- `/api/readiness` ile DB + env readiness kontrolü
- `npm run security:check` ve `npm run v27:check`

## Üretim notu
CSP şu aşamada Mapbox/video/Capacitor uyumluluğu için `unsafe-inline` ve `unsafe-eval` içerir. Mağaza/staging doğrulamasından sonra nonce/hash tabanlı daha katı CSP'ye geçilmelidir.

## Migration notu
Bu proje bugüne kadar hızlı MVP geliştirme için `prisma db push` kullandı. Production verisi oluşmadan önce şema baseline migration'a çevrilmeli, sonrasında yalnız `prisma migrate deploy` kullanılmalıdır.
