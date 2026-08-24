# Alumas V19 — Klinik Geçmiş ve Acil Sağlık Kartı

## Yeni modüller

- `/health/imaging`: MR, BT, röntgen, ultrason, mamografi, PET ve diğer görüntüleme sonuçları.
- `/health/tasks`: doktorun oluşturduğu laboratuvar / görüntüleme / kontrol istekleri.
- `/health/timeline`: randevu, laboratuvar, görüntüleme, tetkik isteği, doktor sorusu ve bakım görevlerinden oluşan birleşik geçmiş.
- `/health-card`: kullanıcının kendi yönettiği kısa acil sağlık kartı.
- `/health-card/[token]`: yalnızca kullanıcı paylaşımı açtığında çalışan sınırlı, gizli bağlantı.

## Gizlilik

Acil sağlık kartı tam sağlık dosyasını paylaşmaz. Yalnızca kullanıcının özellikle yazdığı kan grubu, alerji, kronik durum, önemli ilaç, acil iletişim ve not alanlarını gösterir. Paylaşım varsayılan olarak kapalıdır.

## Tetkik akışı

Doktor yalnızca randevu ilişkisi bulunan hasta için tetkik isteği oluşturabilir. Hasta isteği `requested → scheduled → completed` akışıyla takip eder. Tetkik bitiş tarihleri Sağlık Takvimi'ne eklenir.

## Görüntüleme dosyaları

PDF/JPG/PNG dosyaları private storage katmanında tutulur. Dosya indirme endpoint'i kullanıcı, admin veya geçerli `imaging` paylaşım izni bulunan doktor için açılır.
