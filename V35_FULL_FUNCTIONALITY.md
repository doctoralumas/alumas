# Alumas v35 — Full Functionality Completion

## Hesap ve profil onboarding
- Hasta: doğrudan kişisel profil
- Doktor: kayıt sonrası Alumas Pro profil formu, admin doğrulaması, sonra halka açık yayın
- Hastane/Klinik/Eczane: mevcut Alumas Business başvurusu ve admin doğrulaması
- Sağlık turizmi acentesi: yeni acente başvurusu, kendi paneli, hizmet/paket ekleme ve admin doğrulaması

## Google Maps / Places
`/nearby` sayfası Places API (New) ile canlı konuma göre hastane, klinik, eczane, doktor, sağlık kuruluşu ve otel arar. Acil kategorisi konuma yakın “acil servis” Text Search kullanır.

Server anahtarı: `GOOGLE_PLACES_API_KEY`
Browser harita anahtarı: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

Google Places içerikleri veritabanına kalıcı kopyalanmaz. Yalnızca uygulamanın kendi kurumları PostgreSQL’de kalıcıdır.

## Doğrulama
Profesyonel profiller public yayın öncesi admin onayına tabidir.
