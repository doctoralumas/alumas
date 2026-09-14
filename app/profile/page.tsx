import SectionVisual from "@/components/section-visual";import {redirect} from "next/navigation";import {currentUser} from "@/lib/auth";import {ShieldCheck,UserRound} from "@/components/icons";import LogoutButton from "@/components/logout-button";import OtpPanel from "@/components/otp-panel";import PushSettings from "@/components/push-settings";import PrivacyCenter from "@/components/privacy-center";import AccountControls from "@/components/account-controls";import FavoriteOrganizations from "@/components/favorite-organizations";import FavoriteDoctors from "@/components/favorite-doctors";import {prisma} from "@/lib/prisma";
export default async function Profile(){const user=await currentUser();if(!user)redirect('/login');const [orgCount,agencyCount]=await Promise.all([prisma.organization.count({where:{ownerUserId:user.id}}),prisma.healthTourismAgency.count({where:{ownerUserId:user.id}})]);
const displayRole = user.role === 'ADMIN' ? 'Yönetici' : user.role === 'DOCTOR' ? 'Uzman' : orgCount > 0 ? 'Kurum Yöneticisi' : agencyCount > 0 ? 'Acente Yöneticisi' : 'Hasta';
return <div className="page"><SectionVisual slug="profile" alt="Profil"/><div className="page-title"><span className="kicker">Hesap</span><h1>Profil</h1></div><section className="profile-card"><div className="avatar xl"><UserRound/></div><div className="grow"><h2>{user.name}</h2><p>{user.email}</p><span className="role-badge">{displayRole}</span></div><LogoutButton/></section>
<section className="panel health-section">
  <h2>Profesyonel paneller</h2>
  <p>Kurum, acente veya uzman hesaplarınızı buradan yönetebilir veya yeni başvuru yapabilirsiniz.</p>
  <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
    {orgCount > 0 ? (
      <a href="/business" className="primary compact">Kurum Paneli</a>
    ) : (
      <a href="/business/apply" className="secondary compact">Kurum Başvurusu</a>
    )}
    
    {agencyCount > 0 ? (
      <a href="/agency" className="primary compact">Acente Paneli</a>
    ) : (
      <a href="/agency/apply" className="secondary compact">Acente Başvurusu</a>
    )}

    {user.role === 'DOCTOR' ? (
      <a href="/doctor" className="primary compact">Uzman Paneli</a>
    ) : (
      <a href="/onboarding/doctor" className="secondary compact">Uzman Başvurusu</a>
    )}
    
    {user.role === 'ADMIN' && (
      <a href="/admin" className="primary compact" style={{background: '#991b1b', color: 'white'}}>Admin Paneli</a>
    )}
  </div>
</section>
<section className="panel"><h2>Telefon doğrulama</h2><p>Geliştirmede konsol sağlayıcısı kullanılabilir; production ortamında SMS_PROVIDER=twilio ile gerçek SMS doğrulaması yapılır.</p><OtpPanel/></section><section className="panel health-section"><h2>Bildirimler</h2><p>Randevu, mesaj ve bakım planı bildirimlerini bu cihazda yönet.</p><PushSettings/></section><section className="panel health-section"><h2>Gizlilik & güvenlik</h2><div className="trust-box"><ShieldCheck/><div><b>Rol bazlı erişim</b><span>Hasta, uzman ve yönetici hesapları farklı yetkilerle çalışır; oturum çerezleri JavaScript erişimine kapalıdır.</span></div></div></section><section className="panel health-section"><h2>Gizlilik merkezi</h2><p>Aydınlatma, sağlık entegrasyonu ve isteğe bağlı iletişim tercihlerini ayrı ayrı yönet.</p><PrivacyCenter/></section><section className="panel health-section"><div className="row between"><h2>Sağlık çevrem</h2><a className="secondary compact" href="/health-circle">Tümünü aç</a></div><p>Favori doktorların, kurumların ve aktif sağlık ilişkilerin.</p></section><section className="panel health-section"><h2>Favori doktorlarım</h2><FavoriteDoctors/></section><section className="panel health-section"><h2>Favori kurumlarım</h2><FavoriteOrganizations/></section><section className="panel health-section"><h2>Verilerim & hesabım</h2><AccountControls/></section></div>}
