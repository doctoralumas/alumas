# Alumas v13 — Sağlık Ağı & Güven Katmanı

Bu sürüm v12 marketplace üzerine şu özellikleri ekler:

- Mapbox GL ile interaktif kurum haritası ve tıklanabilir pinler
- Google Maps yol tarifi bağlantıları
- Favori doktorlar
- Sağlık Çevrem ekranı (`/health-circle`)
- Doktor ve kurum yorumlarında admin moderasyonu
- Tamamlanmış görüşme sonrası doktor değerlendirmesi
- Doktor panelinden görüşmeyi tamamlandı işaretleme
- Production cron endpoint'i ile geçmiş randevular için otomatik değerlendirme isteği

## Yeni API'ler

- `GET/POST/DELETE /api/doctors/:id/favorite`
- `GET /api/doctors/favorites`
- `GET/POST /api/doctors/:id/reviews`
- `GET/PATCH /api/admin/reviews`
- `POST /api/cron/appointments`

## Yorum moderasyonu

Yeni veya güncellenen kullanıcı yorumları `PENDING` durumuna döner. Yalnızca `APPROVED` yorumlar halka açık ortalamaya ve listeye katılır. Admin `/admin/reviews` üzerinden yayınlar veya reddeder.

## Otomatik değerlendirme isteği

Production scheduler aşağıdaki endpoint'i güvenli bir Bearer secret ile çağırabilir:

```bash
curl -X POST https://app.alumas.com/api/cron/appointments \
  -H "Authorization: Bearer $CRON_SECRET"
```

Endpoint, başlangıcının üzerinden en az 60 dakika geçmiş `confirmed` randevuları `completed` yapar ve değerlendirme isteğini yalnızca bir kez gönderir.

## Harita

`.env` içine:

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=...
MAPBOX_ACCESS_TOKEN=...
```

eklenirse `/organizations` sayfasında pan/zoom destekli Mapbox haritası kullanılır.
