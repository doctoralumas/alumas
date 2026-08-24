# Alumas v53 — Professional Accounts & Verification

Profesyonel hesap tipleri:
Doktor, hastane, klinik, muayenehane, eczane, laboratuvar, görüntüleme merkezi, evde sağlık, sağlık turizmi acentesi ve diğer sağlık kuruluşları.

## Sağlık turizmi acentesi
Acente başvurusu ayrı akıştır. Yetki belgesi numarası, düzenleyen kurum, düzenlenme/sona erme tarihleri ve belge referansı tutulur. Belge `APPROVED` olmadan profesyonel hesap onaylanamaz. Hesap ve belge onayı olmadan paket yayını/hasta yönlendirme gibi operasyonel yetkiler açılmaz.

## Doğrulama
`ProfessionalVerificationDocument` farklı hesap tiplerinin kimlik, ruhsat, uzmanlık ve kurum belgelerini saklamak için metadata katmanıdır. Dosyanın kendisi private object storage'da tutulmalıdır; public URL kullanılmamalıdır.

## Paneller
Tek `Alumas Professional` kabuğu hesap türüne göre farklı modülleri gösterir. Bu sürüm panel kabuğu, veri modeli, doğrulama statüleri ve kritik API guard'larını ekler. Her modülün mevcut Alumas servislerine bağlanması staging sırasında tek tek doğrulanmalıdır.

## Hukuki not
“Alumas tarafından doğrulandı” yalnız admin belge incelemesi tamamlandıktan sonra gösterilir. Bu teknik mekanizma mevzuata uygunluk veya resmi makam doğrulaması garantisi değildir.
