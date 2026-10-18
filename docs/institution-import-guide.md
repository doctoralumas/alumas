# ALUMAS — Sağlık Kurumları Toplu İçe Aktarım Rehberi (Bulk Institution Importer)

Bu rehber, Türkiye genelindeki sağlık kurumlarının (hastane, klinik, eczane, laboratuvar, görüntüleme merkezi) Excel (`.xlsx`) veya CSV (`.csv`) dosyaları aracılığıyla ALUMAS dizinine (`DirectoryInstitution` tablosu) toplu, güvenli ve tekrarlanabilir biçimde nasıl ekleneceğini açıklar.

---

## 1. Hızlı Kullanım (Quick Start)

### Adım 1: Önizleme ve Doğrulama (DRY-RUN)
Veritabanına hiçbir şey yazmadan simülasyon yapmak için:

```bash
# Excel (.xlsx) ile önizleme
node scripts/import-directory-institutions.mjs --file data/imports/kurumlar.xlsx

# veya CSV (.csv) ile önizleme
node scripts/import-directory-institutions.mjs --file data/imports/kurumlar.csv
```

### Adım 2: Canlı Veritabanına Aktarma (APPLY)
Önizleme raporunu inceleyip onayladıktan sonra canlı veritabanına yazmak için:

```bash
# Canlı Supabase veritabanına kontrollü yazma
node scripts/import-directory-institutions.mjs --file data/imports/kurumlar.xlsx --apply --confirm-remote-apply
```

> **GÜVENLİK KİLİDİ:** Canlı / uzak Supabase veritabanında (`pooler.supabase.com`), `--apply` komutu `--confirm-remote-apply` parametresi olmadan kazara çalıştırılamaz; sistem otomatik olarak durdurulur.

---

## 2. Desteklenen Dosya Formatları ve Kolon Başlıkları

Importer hem `.xlsx` (Excel) hem de `.csv` dosyalarını doğrudan kabul eder. Excel dosyaları Python standart kütüphanesi aracılığıyla arka planda otomatik olarak dönüştürülür.

CSV veya Excel dosyanızın ilk satırında aşağıdaki başlıklardan herhangi birini kullanabilirsiniz (Türkçe ve İngilizce eşanlamlılar desteklenir):

| Standart Alan | Desteklenen Alternatif Başlıklar | Zorunlu mu? | Açıklama / Kabul Edilen Değerler |
| :--- | :--- | :---: | :--- |
| `name` | `kurum_adi`, `kurum`, `institution_name` | **EVET** | Kurumun resmi unvanı (en az 3 karakter). |
| `type` | `kurum_turu`, `tur`, `category` | **EVET** | `HOSPITAL`, `CLINIC`, `PHARMACY`, `IMAGING_CENTER`, `LABORATORY`<br>*(veya Özel Hastane, Devlet Hastanesi, Şehir Hastanesi, Tıp Merkezi, Poliklinik, Eczane, Görüntüleme Merkezi, Tıbbi Laboratuvar)* |
| `city` | `il`, `sehir`, `province` | **EVET** | İl adı (örn. *İstanbul*, *Ankara*). |
| `district` | `ilce` | Tavsiye edilir | İlçe adı (Şube ayrımı ve arama için kritik). |
| `address` | `acik_adres`, `adres`, `full_address` | **EVET** | Cadde, sokak ve kapı no içeren açık adres. |
| `phone` | `telefon`, `telephone` | Hayır (Opsiyonel) | Varsa santral numarası. Yoksa boş bırakın (sahte numara yazmayın). |
| `officialWebsite`| `web_sitesi`, `url`, `official_website` | Hayır (Opsiyonel) | Kurumun resmi HTTPS adresi. Güvensiz/zararlı linkler elenir. |
| `latitude` | `lat`, `enlem` | Hayır (Opsiyonel) | Sayısal WGS-84 enlem (-90..90). |
| `longitude` | `lng`, `lon`, `boylam` | Hayır (Opsiyonel) | Sayısal WGS-84 boylam (-180..180). |
| `externalRef` | `kurum_kodu`, `ref`, `source_ref` | Tavsiye edilir | Kalıcı kaynak kodu (örn. `TR-IST-HOSP-BAYRAMPASA-DEVLET`). Satır numarası vermeyin; kurum adı ve ilçesinden türetilmiş kalıcı kod kullanın. |
| `source` | `kaynak`, `source_provenance` | Hayır (Opsiyonel) | Veri kaynağı (örn. `IBB_ACIK_VERI_PORTALI`, `SAGLIK_BAKANLIGI_SKRS`). |
| `lastVerifiedAt` | `dogrulama_tarihi`, `verified_at` | Hayır (Opsiyonel) | ISO-8601 tarihi (örn. `2024-03-18`). |
| `description` | `aciklama` | Hayır (Opsiyonel) | Kurum hakkında kısa açıklama. |

---

## 3. Rapor İfadeleri ve Anlamları

Importer çalıştırıldığında her satır için aşağıdaki etiketlerden birini raporlar:

* `[CREATE]`: Yeni ve geçerli kurum. Veritabanına `organizationId = null` olarak eklenecektir.
* `[UPDATE]`: Mevcut bir sahipsiz dizin kaydının adres, telefon veya koordinat gibi bilgileri güncellenecektir.
* `[UNCHANGED]`: Veritabanındaki mevcut kayıtla birebir aynıdır; tekrar yazılmaz (idempotent no-op).
* `[SKIP_OWN]`: **KORUMA ALTINDA.** Bu kurum onaylı bir ALUMAS kurumuna (`Organization`) veya aktif bir sahiplenme başvurusuna bağlıdır. Sahiplik ve onay durumuna asla müdahale edilmez.
* `[DUP_CSV]`: Dosya içinde mükerrer kurum/şube referansı bulunmuştur; ikinci kayıt atlanır.
* `[REVIEW]`: Aynı il/ilçede adı çok benzeyen veya aynı açık adresi paylaşan şüpheli kayıt tespit edilmiştir; otomatik eklenmez, manuel inceleme için raporlanır.
* `[INVALID]`: Zorunlu alanı eksik, geçersiz kategorili veya zararlı URL içeren hatalı satır; reddedilir.

---

## 4. Temel Kurallar ve Güvenlik İlkeleri

1. **Mavi Rozet Güvenliği:** İçe aktarılan kurumlar ALUMAS mavi doğrulama rozeti **ALMAZ**. Ziyaretçilere harici dizin kartı olarak gösterilir ve yetkililere "Kurumu Sahiplen" butonu sunar.
2. **Kalıcı Kimlik:** Kaynak ID'si (`externalRef`) olarak Excel satır numaralarını kullanmayın. Sıralama değiştiğinde kimliklerin bozulmaması için kurum adı ve ilçesini içeren semantik kodlar (örn. `TR-IST-HOSP-AVRASYA-ZEYTINBURNU`) kullanın.
3. **Eksik Bilgi Disiplini:** Telefonu, web sitesi veya koordinatı olmayan kayıtlar için sahte/yer tutucu bilgi uydurmayın; bu alanları boş bırakın.

