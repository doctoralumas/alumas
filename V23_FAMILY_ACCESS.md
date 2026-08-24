# Alumas v23 — Aile Erişimi ve Ortak Bakım

## Eklenenler
- Çocuk/gebelik profiline e-posta ile yakın/ebeveyn daveti
- Davet: bekliyor, kabul edildi, reddedildi, iptal edildi
- Kabul sonrası geri alınabilir kalıcı erişim kaydı
- Profil bazlı izinler: `VIEW`, `APPOINTMENTS`, `REMINDERS`, `VACCINATIONS`, `GROWTH`, `EDIT_PROFILE`
- Gelen/giden davetler ve aktif paylaşımlar için `/health/family-access`
- Uygulama içi bildirim ve yapılandırılmış push notification
- Paylaşılan profil verilerinde backend seviyesinde izin kontrolü
- Büyüme kaydı ve aile görevi API'lerinde izin zorunluluğu

## Güvenlik modeli
Profil sahibi tüm yetkilere sahiptir. Davet edilen kullanıcı yalnızca kabul ettiği ve profil sahibinin verdiği kapsamlarla işlem yapabilir. `VIEW` izni olmadan profil açılamaz; örneğin `GROWTH` izni olmayan bir kullanıcı çocuk büyüme kaydı ekleyemez.

Davetler 7 gün sonra süresi dolacak şekilde oluşturulur. Profil sahibi erişimi sonradan devre dışı bırakabilir.
