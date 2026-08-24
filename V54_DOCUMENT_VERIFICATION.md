# Alumas v54 — Zorunlu Belge Doğrulama

## Hesap türüne özel belgeler
Doktor, hastane, klinik, muayenehane, eczane, laboratuvar, görüntüleme merkezi, evde sağlık, sağlık turizmi acentesi ve diğer sağlık kuruluşları için ayrı zorunlu belge listeleri tanımlandı.

## Akış
Kayıt → profesyonel hesap → gerekli belgeleri private storage'a yükleme → admin inceleme → belge onayı → hesap onayı.

## Sağlık turizmi acentesi
Uluslararası sağlık turizmi yetki belgesi onaylı değilse profesyonel hesap aktifleşmez.

## Güvenlik
Belgenin kendisi public profil sayfasında gösterilmez. Kullanıcı yalnız doğrulama rozetini görür.
Dosya depolama anahtarı private object storage referansı olmalıdır.

## Süre takibi
Geçerlilik tarihi geçen onaylı belgeler `EXPIRED` durumuna alınabilir ve ilgili profesyonel hesabın doğrulaması düşürülür.

## Staging testi
Bu sürüm belge modeli, kurallar, panel ve admin doğrulama akışını tamamlar. Private storage, gerçek dosya yükleme ve uçtan uca onay akışı staging ortamında test edilmeden production-ready kabul edilmemelidir.
