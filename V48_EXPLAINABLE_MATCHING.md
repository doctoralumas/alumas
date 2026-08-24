# Alumas v48 — Açıklanabilir Doktor/Kurum Eşleştirme Motoru

Yeni motor, AI yönlendirme sonrası doğrulanmış doktorları açıklanabilir bir skorla sıralar.

## Puanlama
- Branş uyumu: %42
- Konum/yakınlık: %18
- Müsaitlik: %16
- Profil doğrulama: %10
- Kurum yayın/aktif durumu: %6
- Kullanıcı değerlendirme kalitesi: %8

Motor tanı koymaz. Yalnız yönlendirme sonrası uygun sağlık hizmeti seçeneklerini sıralar.

## API
`POST /api/ai/matches`

Örnek gövde:
```json
{"specialty":"Kardiyoloji","lat":40.99,"lng":29.12,"limit":8}
```

Her yanıtta şu sabit uyarı yer alır:
`Ben sağlık profesyoneli değilim.`

## Sonraki genişletmeler
- Kullanıcı sigorta planı eşleşmesi
- Tercih edilen dil/cinsiyet gibi açıkça verilmiş tercihlerin eklenmesi
- Gerçek zamanlı Google Places mesafe/açık-kapalı bilgisi
- Kurum kalite sinyallerinin ayrı doğrulama katmanı
