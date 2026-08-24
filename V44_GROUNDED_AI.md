# Alumas v44 — Kaynaklı ve Yorumlayan AI Navigasyonu

- Her cevapta zorunlu uyarı: **Ben sağlık profesyoneli değilim.**
- Ajan artık `commentary` alanında yönlendirmesinin nedenini kısa ve kontrollü biçimde açıklar.
- Doktorlar yalnız `isVerified=true` + `isPublished=true` kaynaklarından gelir.
- Kurumlar yalnız `APPROVED` + `isPublished=true` kaynaklarından gelir.
- Canlı müsaitlik ayrı kaynak olarak kullanıcıya gösterilir.
- Her cevap `sources[]` listesi içerir.
- `MEDICAL_KB_PROVIDER` bağlı değilse arayüz açıkça tıbbi bilgi kaynağı olmadığını belirtir ve hastalık/tedavi yorumu üretmez.
- Tıbbi bilgi sağlayıcısı bağlandığında bu kaynak ayrı ve görünür biçimde işaretlenecektir.
