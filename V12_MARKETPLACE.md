# Alumas v12 — Marketplace & Nearby

Bu sürüm kurum ağını kullanıcı deneyimiyle birleştirir.

## Yeni akışlar

- Kurum profilinden doğrudan randevu oluşturma.
- "Tüm uzmanlar" seçeneği ile kurum içindeki doktorların açık saatlerini tek kronolojik listede görme.
- Randevuyu organizationId ile kuruma bağlama ve doktor-kurum eşleşmesini backend'de doğrulama.
- Tarayıcı konum izni ile kurumları kilometre bazında yakından uzağa sıralama.
- Nöbetçi eczane filtresi ve eczane panelinden nöbet durumu/bitiş zamanı yönetimi.
- Kurumları favoriye ekleme/çıkarma ve Profil ekranında favorileri görme.
- Hasta hesabıyla 1–5 yıldız kurum değerlendirmesi ve yorum güncelleme.
- Kurum liste/profilinde değerlendirme ortalaması.

## Veritabanı değişiklikleri

`OrganizationFavorite`, `OrganizationReview`, `Organization.isOnDuty`, `Organization.onDutyUntil` ve `Appointment.organizationId` eklendi.

Şema güncellemesi için:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

Kaynak akış kontrolü:

```bash
npm run marketplace:check
```

Not: Konuma göre sıralama tarayıcı geolocation iznine bağlıdır. Harita görseli için Mapbox anahtarları önceki sürümdeki gibi opsiyoneldir.
