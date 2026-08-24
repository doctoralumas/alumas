import Link from "next/link";

type Item={href:string;title:string;desc:string;tone:string};
const groups:{title:string;items:Item[]}[]=[
  {title:"Sağlık hizmetleri",items:[
    {href:"/doctors",title:"Doktor Bul",desc:"Uzmanları incele, müsaitlik gör ve randevu al.",tone:"blue"},
    {href:"/organizations",title:"Hastane & Klinik",desc:"Doğrulanmış sağlık kurumlarını keşfet.",tone:"blue2"},
    {href:"/nearby",title:"Yakınımdakiler",desc:"Hastane, klinik, eczane, acil servis ve otel bul.",tone:"mint"},
    {href:"/home-care",title:"Evde Sağlık",desc:"Doktor, hemşire ve evde bakım hizmetleri.",tone:"teal"},
    {href:"/emergency",title:"Acil / 112",desc:"112, ambulans, acil servis ve sağlık kartı.",tone:"emergency"},
    {href:"/health-tourism",title:"Sağlık Turizmi",desc:"Acente, paket, transfer, konaklama ve tercüman.",tone:"navy"},
    {href:"/insurance",title:"Sigortalar",desc:"Sigorta sağlayıcıları ve anlaşmalı kurumlar.",tone:"ice"},
    {href:"/campaigns",title:"Kampanyalar",desc:"Sağlık kurumlarının kampanya ve duyuruları.",tone:"sand"},
    {href:"/phone-directory",title:"Telefon Rehberi",desc:"112 ve favori sağlık numaraları.",tone:"lavender"},
  ]},
  {title:"Kişisel sağlık",items:[
    {href:"/health",title:"Sağlığım",desc:"Kişisel sağlık merkezine git.",tone:"blue"},
    {href:"/health/blood-pressure",title:"Tansiyon",desc:"Sistolik, diyastolik ve nabız takibi.",tone:"mint"},
    {href:"/health/glucose",title:"Kan Şekeri",desc:"Açlık/tokluk glukoz kayıtları.",tone:"sand"},
    {href:"/health/sleep",title:"Uyku",desc:"Uyku süresi ve kalite takibi.",tone:"lavender"},
    {href:"/health/water",title:"Su Takibi",desc:"Günlük su tüketimini kaydet.",tone:"blue2"},
    {href:"/health/body",title:"Kilo & Boy",desc:"Vücut ölçümleri ve trendler.",tone:"teal"},
    {href:"/health/cycle",title:"Regl Takibi",desc:"Döngü, akış, belirtiler ve geçmiş kayıtları.",tone:"pink"},
    {href:"/health/medications",title:"İlaçlarım",desc:"İlaç, doz ve kullanım hatırlatıcıları.",tone:"sand"},
    {href:"/health/labs",title:"Laboratuvar",desc:"Tahlil sonuçları, referans ve trendler.",tone:"blue"},
    {href:"/health/imaging",title:"Radyoloji",desc:"MR, BT, röntgen ve görüntüleme kayıtları.",tone:"blue2"},
    {href:"/health/vaccinations",title:"Aşı Takvimi",desc:"Geçmiş aşılar ve sonraki dozlar.",tone:"mint"},
    {href:"/health/allergies",title:"Alerjiler",desc:"Alerji ve reaksiyon kayıtları.",tone:"sand"},
    {href:"/health/medical-history",title:"Sağlık Geçmişi",desc:"Hastalık, ameliyat ve klinik geçmiş.",tone:"lavender"},
    {href:"/health/reports",title:"Sağlık Raporları",desc:"Sağlık özetleri ve paylaşılabilir raporlar.",tone:"ice"},
    {href:"/health-card",title:"Sağlık Kartım",desc:"Acil durumda paylaşılabilen kısa sağlık özeti.",tone:"blue"},
    {href:"/calendar",title:"Takvim & Alarmlar",desc:"Randevu, ilaç ve sağlık hatırlatıcıları.",tone:"teal"},
  ]},
  {title:"Aile ve iletişim",items:[
    {href:"/health/family-hub",title:"Aile Sağlığı",desc:"Aile paneli, çocuk ve gebelik profilleri.",tone:"pink"},
    {href:"/health/family-access",title:"Aile Erişimleri",desc:"Sağlık verisi paylaşım izinlerini yönet.",tone:"mint"},
    {href:"/health/family-profiles",title:"Çocuk & Gebelik",desc:"Özel sağlık profillerini yönet.",tone:"lavender"},
    {href:"/appointments",title:"Randevularım",desc:"Yaklaşan ve geçmiş randevular.",tone:"blue2"},
    {href:"/messages",title:"Mesajlar",desc:"Sağlık profesyonelleriyle güvenli mesajlaşma.",tone:"ice"},
    {href:"/notifications",title:"Bildirimler",desc:"Randevu ve takip bildirimlerini yönet.",tone:"sand"},
    {href:"/health-circle",title:"Sağlık Çevrem",desc:"Paylaşım, takip ve bakım işbirliği.",tone:"teal"},
  ]},
  {title:"Profesyonel hesaplar",items:[
    {href:"/onboarding/doctor",title:"Doktor Profili",desc:"Doktor profilini oluştur ve doğrulama sürecini başlat.",tone:"blue"},
    {href:"/business/apply",title:"Hastane / Klinik / Eczane",desc:"Kurum başvurusu oluştur ve yönetim panelini aç.",tone:"mint"},
    {href:"/agency/apply",title:"Sağlık Turizmi Acentesi",desc:"Acente profilini ve hizmetlerini oluştur.",tone:"navy"},
    {href:"/profile",title:"Profil & Hesaplar",desc:"Kişisel ve profesyonel hesap geçişlerini yönet.",tone:"ice"},
  ]}
];

export default function Services(){return <div className="page services-page"><div className="page-title"><span className="kicker">Alumas</span><h1>Tüm Hizmetler</h1><p>Uygulamadaki bütün ana modüllere tek ekrandan ulaş.</p></div>{groups.map(g=><section key={g.title} className="services-section"><h2>{g.title}</h2><div className="services-grid">{g.items.map(i=><Link key={i.href} href={i.href} className={`service-link ${i.tone}`}><b>{i.title}</b><span>{i.desc}</span><em>›</em></Link>)}</div></section>)}</div>}
