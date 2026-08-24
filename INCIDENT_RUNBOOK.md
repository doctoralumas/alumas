# Alumas Production Incident Runbook

## İlk 15 dakika
1. Incident başlangıç saatini ve etkilenen ortamı kaydet.
2. `/api/healthcheck` ve `/api/readiness` kontrol et.
3. Son deploy SHA/sürümünü belirle.
4. Request ID ile yapılandırılmış logları ve Sentry olaylarını ilişkilendir.
5. Veri bütünlüğü riski varsa yazma işlemlerini/deploy'u durdur.
6. Sağlık verisi veya yetkisiz erişim şüphesinde security/privacy sorumlusunu dahil et.

## Sınıflandırma
- SEV-1: veri güvenliği, geniş erişim kesintisi, yanlış kullanıcıya sağlık verisi gösterimi.
- SEV-2: temel randevu/login/sağlık kaydı fonksiyonu ciddi bozuk.
- SEV-3: sınırlı fonksiyon/UI sorunu.

## Rollback
- Önce uygulama sürümünü rollback et.
- Migration geri dönüşü otomatik varsayılmaz. Veri kaybettiren SQL çalıştırmadan önce backup ve inceleme gerekir.

## Backup / restore
- En son doğrulanmış backup zamanını kaydet.
- Restore'u önce izole DB üzerinde doğrula.
- Production restore için açık değişiklik kaydı ve çift kontrol önerilir.

## Incident sonrası
- Kök neden, etki aralığı, algılama boşluğu, aksiyon sahipleri ve son tarihleri yaz.
- Runbook/test/alert eksiğini kalıcı iş maddesine dönüştür.
