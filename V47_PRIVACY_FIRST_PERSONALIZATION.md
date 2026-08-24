# Alumas v47 — Privacy-first personalization

- Kişiselleştirme varsayılan olarak kapalıdır ve kullanıcı açıkça açar.
- Yalnız oturum açmış kullanıcı için gerekli minimum profil alanları okunur.
- Yaş tam tarih yerine yaş aralığına indirgenir.
- Aktif sağlık durumları, aktif ilaçlar, aktif alerjiler ve aktif özel profil sinyalleri yalnız yönlendirme bağlamı olarak kullanılır.
- Bu sürümde kişisel sağlık verileri harici bir LLM'e gönderilmez.
- Audit log ham sağlık verisini değil, yalnız hangi veri kategorilerinin kullanıldığını kaydeder.
- Sigorta kişiselleştirmesi mevcut şemada kullanıcı-sigorta ilişkisi olmadığı için eklenmemiştir.
- Cinsiyet alanı mevcut kullanıcı şemasında bulunmadığı için varsayılmaz veya türetilmez.
- Her sağlık yanıtında zorunlu güvenlik bildirimi korunur.
