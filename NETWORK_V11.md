# Alumas Network v11

Bu sürüm kurum marketplace katmanını genişletir.

- Yayındaki kurumlar için `/organizations/[slug]` profil sayfası
- Kurum sahibine `/business/[id]` yönetim ekranı
- Hizmet + fiyat yönetimi
- Haftalık çalışma saatleri
- Doktor daveti ve doktorun kabul/red akışı
- Eczane stok arama; halka açık sonuçlarda adet gizlenir
- Mapbox geocoding adaptörü ve koordinat saklama
- Mapbox token varsa kurum profilinde statik harita; yoksa koordinat/Google Maps yönlendirmesi

## Mapbox
`.env` içine `MAPBOX_ACCESS_TOKEN` ve istemci statik harita için `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` girin.

## Veritabanı
Şema değiştiği için `npm run db:generate && npm run db:push && npm run db:seed` çalıştırın.

## Kontrol
`npm run network:check`
