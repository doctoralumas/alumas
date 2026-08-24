# Alumas v49 — Bağlamsal Sağlık Hizmeti Eşleştirme

v49 ile eşleştirme motoruna dört gerçek dünya sinyali eklendi:

- Sigorta uyumu
- Kullanıcının gerçek konumu / mesafe
- Bugün ve yakın tarih randevu müsaitliği
- Kurumun açık / kapalı / nöbetçi durumu

## Yeni veri modelleri
- `OrganizationInsurance`
- `UserInsurancePreference`

## Yeni API
- `POST /api/ai/matches` — açıklanabilir doktor eşleştirme
- `POST /api/ai/facilities` — hastane/klinik/eczane bağlamsal sıralama

## Güvenlik
Her sağlık yanıtı `Ben sağlık profesyoneli değilim.` ifadesini içerir.
Motor tanı koymaz; yalnız uygun sağlık hizmeti seçeneklerini sıralar.

## Not
Gerçek açık/kapalı ve sigorta verisinin doğruluğu kurumların Alumas panelinde güncel veri tutmasına bağlıdır.
Google Places canlı verisi sonraki entegrasyon katmanı olarak kullanılabilir.
