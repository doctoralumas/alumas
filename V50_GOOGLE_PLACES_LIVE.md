# Alumas v50 — Google Places Canlı Sağlık Kurumları

## Eklenenler
- Google Places API (New) Nearby Search
- Hastane, doktor ve eczane canlı yakınlık sonuçları
- `currentOpeningHours.openNow` üzerinden canlı açık/kapalı sinyali
- Google Maps bağlantısı
- Alumas doğrulanmış kurumları + Google canlı sonuçlarının hibrit sıralaması

## API'ler
- `POST /api/places/live`
- `POST /api/ai/facilities/live`

## Güvenlik ve doğruluk
Google'daki `openNow` alanı kurumun o anda açık olduğunu gösterebilir; **nöbetçi eczane** olduğu anlamına gelmez.
Alumas içindeki `isOnDuty` ayrı bir sinyaldir ve yalnız güvenilir/kurumsal veri kaynağıyla güncellenmelidir.

## Ortam değişkeni
`GOOGLE_PLACES_API_KEY`

Anahtar yalnız sunucu tarafında tutulmalıdır. `NEXT_PUBLIC_` ile yayınlanmamalıdır.
