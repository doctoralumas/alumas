"use client";

import Link from "next/link";
import { 
  Stethoscope, Hospital, MapPin, HouseLine, Ambulance, AirplaneTilt, ShieldCheck, Megaphone, AddressBook,
  Heart, Heartbeat, Drop, Moon, DropHalf, Scales, GenderFemale, Pill, Flask, Scan, Syringe, Bug, ClockCounterClockwise, FileText, IdentificationCard, Calendar,
  Users, Key, Baby, CalendarCheck, ChatTeardropText, Bell, UsersThree
} from "@phosphor-icons/react";

type Item={href:string;title:string;desc:string;tone:string;icon:React.ElementType};
const groups:{title:string;items:Item[]}[]=[
  {title:"Sağlık hizmetleri",items:[
    {href:"/doctors",title:"Doktor & Uzman Bul",desc:"Doktor, diyetisyen ve fizyoterapistleri incele.",tone:"blue",icon:Stethoscope},
    {href:"/organizations",title:"Hastane & Klinik",desc:"Doğrulanmış sağlık kurumlarını keşfet.",tone:"blue2",icon:Hospital},
    {href:"/nearby",title:"Yakınımdakiler",desc:"Hastane, klinik, eczane, acil servis ve otel bul.",tone:"mint",icon:MapPin},
    {href:"/home-care",title:"Evde Sağlık",desc:"Doktor, hemşire ve evde bakım hizmetleri.",tone:"teal",icon:HouseLine},
    {href:"/emergency",title:"Acil / 112",desc:"112, ambulans, acil servis ve sağlık kartı.",tone:"emergency",icon:Ambulance},
    {href:"/health-tourism",title:"Sağlık Turizmi",desc:"Acente, paket, transfer, konaklama ve tercüman.",tone:"navy",icon:AirplaneTilt},
    {href:"/insurance",title:"Sigortalar",desc:"Sigorta sağlayıcıları ve anlaşmalı kurumlar.",tone:"ice",icon:ShieldCheck},
    {href:"/campaigns",title:"Kampanyalar",desc:"Sağlık kurumlarının kampanya ve duyuruları.",tone:"sand",icon:Megaphone},
    {href:"/phone-directory",title:"Telefon Rehberi",desc:"112 ve favori sağlık numaraları.",tone:"lavender",icon:AddressBook},
  ]},
  {title:"Kişisel sağlık",items:[
    {href:"/health",title:"Sağlığım",desc:"Kişisel sağlık merkezine git.",tone:"blue",icon:Heart},
    {href:"/health/blood-pressure",title:"Tansiyon",desc:"Sistolik, diyastolik ve nabız takibi.",tone:"mint",icon:Heartbeat},
    {href:"/health/glucose",title:"Kan Şekeri",desc:"Açlık/tokluk glukoz kayıtları.",tone:"sand",icon:Drop},
    {href:"/health/sleep",title:"Uyku",desc:"Uyku süresi ve kalite takibi.",tone:"lavender",icon:Moon},
    {href:"/health/water",title:"Su Takibi",desc:"Günlük su tüketimini kaydet.",tone:"blue2",icon:DropHalf},
    {href:"/health/body",title:"Kilo & Boy",desc:"Vücut ölçümleri ve trendler.",tone:"teal",icon:Scales},
    {href:"/health/cycle",title:"Regl Takibi",desc:"Döngü, akış, belirtiler ve geçmiş kayıtları.",tone:"pink",icon:GenderFemale},
    {href:"/health/medications",title:"İlaçlarım",desc:"İlaç, doz ve kullanım hatırlatıcıları.",tone:"sand",icon:Pill},
    {href:"/health/labs",title:"Laboratuvar",desc:"Tahlil sonuçları, referans ve trendler.",tone:"blue",icon:Flask},
    {href:"/health/imaging",title:"Radyoloji",desc:"MR, BT, röntgen ve görüntüleme kayıtları.",tone:"blue2",icon:Scan},
    {href:"/health/vaccinations",title:"Aşı Takvimi",desc:"Geçmiş aşılar ve sonraki dozlar.",tone:"mint",icon:Syringe},
    {href:"/health/allergies",title:"Alerjiler",desc:"Alerji ve reaksiyon kayıtları.",tone:"sand",icon:Bug},
    {href:"/health/medical-history",title:"Sağlık Geçmişi",desc:"Hastalık, ameliyat ve klinik geçmiş.",tone:"lavender",icon:ClockCounterClockwise},
    {href:"/health/reports",title:"Sağlık Raporları",desc:"Sağlık özetleri ve paylaşılabilir raporlar.",tone:"ice",icon:FileText},
    {href:"/health-card",title:"Sağlık Kartım",desc:"Acil durumda paylaşılabilen kısa sağlık özeti.",tone:"blue",icon:IdentificationCard},
    {href:"/calendar",title:"Takvim & Alarmlar",desc:"Randevu, ilaç ve sağlık hatırlatıcıları.",tone:"teal",icon:Calendar},
  ]},
  {title:"Aile ve iletişim",items:[
    {href:"/health/family-hub",title:"Aile Sağlığı",desc:"Aile paneli, çocuk ve gebelik profilleri.",tone:"pink",icon:Users},
    {href:"/health/family-access",title:"Aile Erişimleri",desc:"Sağlık verisi paylaşım izinlerini yönet.",tone:"mint",icon:Key},
    {href:"/health/family-profiles",title:"Çocuk & Gebelik",desc:"Özel sağlık profillerini yönet.",tone:"lavender",icon:Baby},
    {href:"/appointments",title:"Randevularım",desc:"Yaklaşan ve geçmiş randevular.",tone:"blue2",icon:CalendarCheck},
    {href:"/messages",title:"Mesajlar",desc:"Sağlık profesyonelleriyle güvenli mesajlaşma.",tone:"ice",icon:ChatTeardropText},
    {href:"/notifications",title:"Bildirimler",desc:"Randevu ve takip bildirimlerini yönet.",tone:"sand",icon:Bell},
    {href:"/health-circle",title:"Sağlık Çevrem",desc:"Paylaşım, takip ve bakım işbirliği.",tone:"teal",icon:UsersThree},
  ]}
];

export default function Services(){
  return (
    <div className="page services-page">
      <div className="page-title">
        <span className="kicker">Alumas</span>
        <h1>Tüm Hizmetler</h1>
        <p>Uygulamadaki bütün ana modüllere tek ekrandan ulaş.</p>
      </div>
      {groups.map(g=>
        <section key={g.title} className="services-section">
          <h2>{g.title}</h2>
          <div className="services-grid">
            {g.items.map(i=>
              <Link key={i.href} href={i.href} className={`service-link ${i.tone}`}>
                <i.icon size={28} weight="duotone" style={{ marginBottom: "auto", opacity: 0.85 }} />
                <b>{i.title}</b>
                <span>{i.desc}</span>
                <em>›</em>
              </Link>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
