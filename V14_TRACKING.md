# Alumas v14 — Sağlık Takibi

V14 ile tansiyon, kan şekeri, uyku, ilaç, alarm ve sağlık takvimi ayrı PostgreSQL modellerine taşındı.

## Yeni rotalar
- `/health/blood-pressure`
- `/health/glucose`
- `/health/sleep`
- `/health/medications`
- `/calendar`

## Mobil alarm
`@capacitor/local-notifications` kullanılır. Paketleri kurduktan sonra `npm run mobile:sync` çalıştırın. Android'de tam saat hassasiyeti gerekiyorsa platform sürümü ve mağaza politikalarına uygun exact alarm iznini ayrıca değerlendirin. Sağlık hatırlatıcılarının klinik acil alarm yerine geçmediği kullanıcı arayüzünde belirtilmelidir.

## Veritabanı
Şema değiştiği için `npm run db:generate && npm run db:push && npm run db:seed` çalıştırılmalıdır.
