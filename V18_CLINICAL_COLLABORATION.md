# Alumas v18 — Klinik iş birliği

Bu sürüm laboratuvar, hedefler, doktor soruları ve sağlık takvimini birbirine bağlar.

## Laboratuvar panel şablonları
Hemogram, Lipid, Tiroid, Karaciğer ve Böbrek şablonları sık kullanılan test adlarını hızlı doldurur. Şablonlar tanı veya referans aralığı üretmez; referans aralığı laboratuvar raporundan girilir.

## Doktor laboratuvar yorumu
Laboratuvar paylaşım izni veya aktif rapor paylaşımı bulunan doktor, belirli bir sonuca yorum ekleyebilir. Yorum hastaya görünür seçildiyse bildirim üretilir.

## Sağlık hedefi ilerlemesi
HealthGoal artık progressPercent (0–100) ve currentValue alanlarını taşır. İlerleme yüzdesi klinik sonuç değil takip göstergesidir.

## Doktora soru
Randevu ilişkisi bulunan hasta doktora konu başlıklı takip sorusu gönderebilir. Doktor yanıtladığında soru `answered` olur ve hastaya bildirim gider.

## Birleşik sağlık takvimi
`/api/calendar` aynı gün için randevular, alarmlar, ortak bakım görevleri, hedef tarihleri, doktor sorusu/yanıt etkinlikleri ve hastayla paylaşılmış laboratuvar yorumlarını döndürür.
