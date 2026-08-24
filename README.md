## v22 Family Centered Care

Aile profiline bağlı randevu, hatırlatıcı, aşı ve seçili doktor paylaşımı eklendi. Ayrıntılar: `V22_FAMILY_CENTERED_CARE.md`.

# Alumas MVP

Alumas; hasta, uzman ve yönetici rollerini tek platformda birleştiren web tabanlı sağlık uygulaması MVP'sidir. Next.js App Router, PostgreSQL ve Prisma ile hazırlanmıştır; ileride Capacitor ile iOS/Android kabuğuna alınabilecek şekilde web-first tasarlanmıştır.

## Bu sürümde çalışan özellikler

- Hasta kayıt ve giriş sistemi
- PBKDF2 ile parola hashleme
- HTTP-only, 30 günlük sunucu oturumu
- PATIENT / DOCTOR / ADMIN rolleri
- Uzman listesi ve profil ekranları
- Doktorun müsait saat açması
- Hastanın yalnızca açık slotlardan randevu seçmesi
- Aynı doktor/saat için çift rezervasyonu engelleyen veritabanı kuralı
- Hasta ve doktor için role göre randevu listesi
- Uzman paneli ve yaklaşan hastalar
- Basit admin operasyon paneli
- Kişisel sağlık ölçümleri API'si
- Responsive web arayüzü

## Kurulum

```bash
cp .env.example .env
docker compose up -d
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Uygulamayı `http://localhost:3000` adresinden açın.

## Demo hesapları

| Rol | E-posta | Parola |
| --- | --- | --- |
| Hasta | demo@alumas.app | Alumas123! |
| Doktor | aylin@alumas.app | Doctor123! |
| Admin | admin@alumas.app | Admin123! |

`db:seed` üç uzman için önümüzdeki 7 güne örnek müsait saatler oluşturur.

## Güvenlik notu

Bu bir MVP'dir. Gerçek sağlık verisiyle prodüksiyona çıkmadan önce KVKK süreçleri, açık rıza/aydınlatma metinleri, denetim kayıtları, MFA/OTP, parola sıfırlama, hız sınırlama, e-posta doğrulama, şifreli dosya depolama, yedekleme, olay izleme ve ayrıntılı rol/izin matrisi tamamlanmalıdır. Sağlık hizmeti sunum şekline göre Türkiye'deki ilgili sağlık mevzuatı ve uygulama mağazası politikaları ayrıca hukuk/regülasyon uzmanlarınca doğrulanmalıdır.

## Sonraki önerilen sprint

1. Telefon OTP + e-posta doğrulama
2. Apple / Google ile giriş
3. Doktor takviminde slot silme/düzenleme ve tekrar eden çalışma saatleri
4. Randevu iptal/erteleme
5. Push bildirimleri
6. Hasta–doktor mesajlaşma
7. Sağlık belgesi yükleme
8. Apple Health / Health Connect entegrasyon katmanı
9. Capacitor iOS/Android projeleri

## v3 özellikleri
- Randevu iptal ve erteleme
- İptal edilen slotun yeniden rezervasyona açılması
- Hasta–uzman uygulama içi mesajlaşma
- Randevu ve mesaj bildirimleri
- Sağlık belgesi yükleme (PDF/JPG/PNG, 8 MB)
- Laboratuvar sonucu kaydetme
- Telefon OTP geliştirme akışı

### Production notları
`data/uploads` yalnızca yerel/MVP geliştirme içindir. Production'da sağlık belgelerini şifreli nesne depolama (S3/R2 vb.), malware tarama, kısa ömürlü imzalı URL ve ayrıntılı erişim loglarıyla saklayın. OTP endpoint'i geliştirmede kodu döndürür; production'da bir SMS sağlayıcısı bağlayın ve rate limit ekleyin.


## v4 additions
- Phone OTP login creates/starts a patient session (development returns OTP code; plug SMS provider into request route for production).
- Push-device registry API for Web/APNs/FCM bridge tokens.
- Care/treatment plans authored by doctors and visible to patients.
- Patient-controlled health sharing consent by scope.
- Apple Health / Android Health Connect bridge contract with least-privilege scopes: steps, heart rate, weight, sleep. Native iOS/Android adapters must implement `window.AlumasHealth` when packaged with Capacitor.
- Doctor shared-health view respects consent scopes.

Production note: never treat browser demo tokens or local file storage as production-grade health-data infrastructure. Use a real SMS provider, APNs/FCM, encrypted object storage, audit logging, consent/version records, rate limiting, and platform privacy declarations.

## v5 mobile additions

- Capacitor 8.5 mobile shell configuration (`com.alumas.health`).
- iOS / Android project bootstrap scripts: `npm run mobile:init`, `mobile:sync`, `mobile:open:*`.
- Official Capacitor Push Notifications client registration; native tokens are persisted through `/api/push`.
- Unified HealthKit + Health Connect native integration via `@capgo/capacitor-health`.
- Device health sync for steps, heart rate, weight and sleep into Alumas health entries.
- Health sync endpoint with authenticated user ownership.
- Alumas icon/splash source assets and Capacitor Assets generation command.
- Store/native setup checklist in `MOBILE_RELEASE.md`.

Because this Next.js app contains server API routes and PostgreSQL access, the native shell points at a deployed HTTPS Alumas URL through `CAPACITOR_SERVER_URL`; it is not a static-export-only app.

## v6 production-readiness additions

- Real SMS OTP adapter (`SMS_PROVIDER=twilio`) with request throttling.
- Firebase Cloud Messaging HTTP v1 server delivery for registered Android/iOS devices.
- Versioned privacy/consent records and a user-facing Privacy Center.
- Self-service JSON data export and account deletion.
- Security/privacy audit log and admin viewer.
- Private local or S3-compatible health-document storage with authenticated downloads.
- Production Dockerfile, compose stack, healthcheck and security headers.

See `PRODUCTION_RELEASE.md` and `.env.production.example` before deployment. The included legal copy is a product placeholder and must be reviewed for the actual data-controller setup and processing purposes before handling real health data.

## v7 staging / beta release additions

- Staging Docker stack and `.env.staging.example`.
- Strict staging/production environment validation scripts.
- HTTP staging preflight checks for health, login and privacy routes.
- App Store and Google Play Turkish metadata draft files under `store/`.
- Static privacy-policy placeholder endpoint for store setup (legal review required before real release).
- GitHub Actions web CI and cross-platform mobile smoke workflows.
- Mobile/release diagnostics (`npm run mobile:doctor`, `npm run release:check`).
- TestFlight and Google Play Internal Testing release runbook in `STAGING_RELEASE.md`.

No Apple/Google signing credentials, Firebase service account, Twilio credential or S3 secret is committed to this repository. Add those only through a secure secret manager or local environment.

## v10 — Kurum başvurusu ve yayın dizini

Bu sürüm hastane, klinik ve eczane profillerini gerçek PostgreSQL kayıtlarına dönüştürür.

- `/business/apply`: giriş yapmış kullanıcı kurum başvurusu yapar ve ruhsat/belge yükleyebilir.
- `/business`: kurum sahibi başvuru durumunu görür.
- `/admin/organizations`: yalnızca ADMIN kurumları onaylar/reddeder.
- `/organizations`: yalnızca `APPROVED + isPublished=true` kurumları kullanıcıya gösterir.
- API: `POST/GET /api/organizations`, `GET /api/organizations/me`, `GET /api/admin/organizations`, `PATCH /api/admin/organizations/:id`.
- Eczaneler için stok endpoint'i, kurumlar için hizmet endpoint'i eklendi.

Şema değiştiği için mevcut veritabanında `npm run db:push` çalıştırılmalıdır.

## Alumas Network v11
Kurum marketplace katmanı artık kurum profil sayfası, hizmet/fiyat yönetimi, çalışma saatleri, doktor daveti/kabulü, eczane stok araması ve Mapbox konum adaptörü içerir. Ayrıntılar için `NETWORK_V11.md` dosyasına bakın.

## v13 — Sağlık Çevrem, interaktif harita ve yorum güveni

V13 ile kurum haritası gerçek Mapbox GL pinlerine geçti; doktor favorileri, `/health-circle`, doktor/kurum yorum moderasyonu ve randevu sonrası otomatik değerlendirme isteği eklendi. Ayrıntılar `V13_HEALTH_NETWORK.md` dosyasında.

Şema güncellemesi sonrası:

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run v13:check
npm run dev
```


## v14 sağlık takibi
Tansiyon, kan şekeri, uyku, ilaç ve hatırlatıcı/takvim modülleri artık PostgreSQL tabanlıdır. Ayrıntılar için `V14_TRACKING.md` dosyasına bakın.


## v15 — hedefler, grafikler, doz takibi ve sağlık raporları

- Tansiyon, kan şekeri ve uyku ekranlarında gerçek SVG trend grafikleri
- Kullanıcının kendi belirlediği kişisel hedef aralıkları; hedef dışı kayıtlar için tanı koymayan bildirim
- İlaç dozlarında `Alındı` / `Atlandı` günlüğü
- `/health/reports` üzerinden son 7 gün / son 30 gün sağlık özeti
- Rapor ekranında tansiyon, glukoz, uyku trendleri ve yalnızca işaretlenmiş dozlar üzerinden kayıtlı doz uyumu
- Tarayıcıdan `Yazdır / PDF` desteği
- Veri dışa aktarımına hedefler ve ilaç doz kayıtları dahil

Şema güncellemesinden sonra `npm run db:generate && npm run db:push` çalıştırın.

> Hedef aralığı uyarıları kişisel takip içindir; tıbbi tanı veya tedavi önerisi değildir.


## V19 — Klinik geçmiş ve acil sağlık kartı
- Görüntüleme/radyoloji sonuçları (MR, BT, röntgen, ultrason vb.)
- Doktor tetkik istekleri ve hasta görev listesi
- Birleşik sağlık geçmişi zaman çizelgesi
- Varsayılan kapalı, kullanıcı kontrollü Acil Sağlık Kartı paylaşımı
- Görüntüleme kayıtlarının sağlık raporu PDF ve veri dışa aktarımına eklenmesi


## v20
Aşı takibi, alerjiler, hastalık/ameliyat geçmişi, gebelik/çocuk profilleri ve Sağlık Özeti eklendi. Ayrıntılar: `V20_HEALTH_PROFILE.md`.

## v21 — Aile Sağlığı
Aile profili geçişi, çocuk büyüme kayıtları, gebelik takip takvimi, aşı hatırlatmaları ve bölüm bazlı Sağlık Özeti paylaşımı için `V21_FAMILY_HEALTH.md` dosyasına bakın.

## v23 — Aile erişimi
`/health/family-access` üzerinden çocuk/gebelik profillerine kontrollü yakın erişimi verilebilir. Yetkiler backend'de profil bazında uygulanır. Ayrıntı: `V23_FAMILY_ACCESS.md`.


## v24 ana kategori tamamlama
Detaylar için `V24_CATEGORY_COMPLETION.md`.


## v25
Departmanlar, kampanyalar, sağlık telefon rehberi/favori numaralar, doktor presence durumu ve gelişmiş sağlık turizmi acente/lojistik modeli eklendi.


## v30 Observability & Ops
Request ID, structured JSON logs, optional Sentry, protected metrics, audit ops dashboard and guarded PostgreSQL backup/restore scripts are included. See `V30_OBSERVABILITY_AND_OPS.md`.

## v31 Release Candidate

Release controls: `V31_RELEASE_CANDIDATE.md`, `RELEASE_CHECKLIST.md`, `RELEASE_PROMOTION.md`.

```bash
npm run v31:check
npm run release:manifest
npm run db:migration:gate
```


## v32 Deployment Packaging
Immutable Docker image promotion, secret matrix, rollback artifact and go/no-go dashboard. See `DEPLOYMENT_PACKAGING.md`.


## v33 Staging Launch

V33 adds DNS/TLS preflight, Caddy reverse proxy templates, staging smoke checks, uptime monitor definitions, cron deployment manifest and a guarded one-command staging launch. See `STAGING_LAUNCH_RUNBOOK.md`.

## v34 staging infrastructure
İlk gerçek VPS staging yayını için `FIRST_LIVE_DEPLOY.md` ve `STAGING_HOST_SECURITY.md` dosyalarını izleyin. Remote deploy immutable image digest + pre-migration DB backup + smoke test kullanır.
