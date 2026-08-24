# Alumas v43 — Güvenli Sağlık Navigasyon Ajanı

Bu sürümde `/ai` ekranı ve `/api/ai/navigate` endpoint’i eklendi.

## Güvenlik ilkeleri
- Tanı koymaz ve reçete/tedavi üretmez.
- Acil belirtiler normal doktor arama akışından ayrılır.
- Doktor sonuçlarında yalnız `isVerified=true` ve `isPublished=true` profiller kullanılır.
- Kurum sonuçlarında yalnız `APPROVED` ve yayınlanmış kurumlar kullanılır.
- Ajan kararları `AuditLog` üzerinden `AI_NAVIGATE` olarak kayda alınır.
- Belirsiz istekte takip sorusu üretir.

## Mimari
Kullanıcı metni → güvenlik/triage → branş/kurum niyeti → doğrulanmış Alumas veritabanı → sonuç.

Bu v1 katmanı deterministik ve test edilebilir bir navigasyon motorudur. İleride bir LLM yalnız doğal dil anlama/yeniden ifade katmanında kullanılabilir; acil karar ve doğrulanmış sonuç filtreleri model dışı kalmalıdır.
