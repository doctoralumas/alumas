# Alumas v41 — Çalıştırma ve doğrulama

## Yerel geliştirme
1. `.env.example` üzerinden `.env` oluşturun.
2. PostgreSQL `DATABASE_URL` tanımlayın.
3. `npm install`
4. `npm run db:generate`
5. `npm run db:push` (geliştirme) veya migration akışını kullanın.
6. `npm run db:seed`
7. `npm run v41:check`
8. `npm run typecheck`
9. `npm run build`
10. `npm run dev`

## Harici servisler
Google Maps/Places, SMS, push, storage ve video gibi özellikler ilgili gerçek API anahtarları olmadan tam canlı çalışmaz. Uygulama kodları ve route'ları pakette mevcuttur.

## Bu pakette doğrulananlar
- 38 kritik sayfa route'u mevcut.
- 15 ana ekran görseli gerçek kartlara bağlı.
- Hasta / Doktor / Kurum / Acente kayıt yönlendirmeleri bağlı.
- Regl Takibi sayfası ve API CRUD route'u mevcut.
- v35 functionality, security ve RC kontrolleri geçti.

## Bu ortamda doğrulanamayan
`npm install` dış paket erişiminde zaman aşımına uğradığı için tam `typecheck` ve `next build` burada tamamlanamadı. Staging kurulumunda bunlar zorunlu gate olarak çalıştırılmalıdır.
