import Link from "next/link";
import { Search } from "@/components/icons";
import HealthNavigator from "@/components/ai/health-navigator";

const tiles = [
  {href:"/health", kicker:"Kişisel sağlık", title:"SAĞLIĞIM", text:"Tüm sağlık verilerin tek yerde", cls:"home-tile blue span7 row2", image:"/home-visuals/health.webp"},
  {href:"/doctors", kicker:"Uzmanlar", title:"DOKTOR BUL", text:"Uzman doktorları bul ve randevu al", cls:"home-tile blue2 span5 row2", image:"/home-visuals/doctor.webp"},
  {href:"/nearby", kicker:"Konum", title:"YAKINIMDAKİLER", text:"Hastane, klinik, eczane, acil ve oteller", cls:"home-tile mint span4 row2", image:"/home-visuals/nearby.webp"},
  {href:"/home-care", kicker:"Alumas Care", title:"EVDE SAĞLIK", text:"Evde bakım ve sağlık hizmetleri", cls:"home-tile teal span4 row2", image:"/home-visuals/home-care.webp"},
  {href:"/emergency", kicker:"Acil erişim", title:"ACİL / 112", text:"Acil servis, ambulans ve sağlık kartına hızlı eriş", cls:"home-tile emergency span4 row2", image:"/home-visuals/emergency.webp"},
  {href:"/health-tourism", kicker:"Uluslararası sağlık", title:"SAĞLIK TURİZMİ", text:"Tedavi, konaklama ve ulaşım hizmetleri", cls:"home-tile navy span8 row2", image:"/home-visuals/health-tourism.webp"},
  {href:"/organizations", kicker:"Kurumlar", title:"HASTANE & KLİNİK", text:"Doğrulanmış sağlık kurumlarını keşfet", cls:"home-tile lavender span4 row2", image:"/home-visuals/organizations.webp"},
  {href:"/health/cycle", kicker:"Kadın sağlığı", title:"REGL TAKİBİ", text:"Döngünü, akışını ve belirtilerini takip et", cls:"home-tile pink span4 row2", image:"/home-visuals/cycle.webp"},
  {href:"/health/medications", kicker:"Takip", title:"İLAÇLARIM", text:"İlaçlarını yönet ve hatırlatıcı kur", cls:"home-tile sand span4 row2", image:"/home-visuals/medications.webp"},
  {href:"/health/labs", kicker:"Sonuçlar", title:"LABORATUVAR", text:"Tahlil sonuçlarını ve trendlerini görüntüle", cls:"home-tile blue span4 row2", image:"/home-visuals/labs.webp"},
  {href:"/insurance", kicker:"Kapsam", title:"SİGORTALARIM", text:"Poliçe ve anlaşmalı kurumlarını yönet", cls:"home-tile mint span4 row2", image:"/home-visuals/insurance.webp"},
  {href:"/calendar", kicker:"Plan", title:"TAKVİM", text:"Randevu ve hatırlatıcılarını gör", cls:"home-tile ice span4 row2", image:"/home-visuals/calendar.webp"},
  {href:"/health-card", kicker:"Acil sağlık özeti", title:"SAĞLIK KARTIM", text:"Önemli sağlık bilgilerini kontrollü paylaş", cls:"home-tile blue2 span4 row2", image:"/home-visuals/health-card.webp"},
  {href:"/profile", kicker:"Hesap", title:"PROFİL & HESAPLAR", text:"Hasta, doktor, kurum ve acente profillerini yönet", cls:"home-tile ice span4 row2", image:"/home-visuals/profile.webp"},
];

export default function Home(){
  return <div className="page home-getir">
    <section className="home-getir-location">
      <div><span className="home-location-pin">⌖</span><div><small>Konum</small><b>Yakınımdaki sağlık hizmetleri</b></div></div>
      <div className="home-location-actions"><Link href="/nearby">Değiştir</Link><Link href="/profile" className="home-mini-avatar">A</Link></div>
    </section>

    <HealthNavigator compact/>

    <section className="home-getir-hero home-getir-hero-with-image">
      <div className="home-hero-copy">
        <span>ALUMAS</span>
        <h1>Sağlığın için<br/>her şey tek yerde.</h1>
        <p>Sağlık kayıtların, randevuların ve ihtiyaçların Alumas’ta.</p>
        <Link className="home-search" href="/doctors"><Search/> Keşfet</Link>
      </div>
      <img className="home-hero-image" src="/home-visuals/hero-doctor.webp" alt="Alumas sağlık hizmetleri"/>
    </section>

    <section className="home-tile-grid home-image-grid">
      {tiles.map(t=>
        <Link href={t.href} className={t.cls} key={t.href}>
          <div className="home-tile-copy">
            <small>{t.kicker}</small>
            <h2>{t.title}</h2>
            <p>{t.text}</p>
          </div>
          <img className="home-tile-image" src={t.image} alt="" aria-hidden="true"/>
          <span className="home-tile-arrow" aria-hidden="true">›</span>
        </Link>
      )}
    </section>

    <section className="home-emergency-strip">
      <Link href="/emergency"><b>ACİL / 112</b><span>Hayati acil durumlarda hızlı erişim</span></Link>
      <a href="tel:112"><b>112</b><span>Acil Ara</span></a>
      <Link href="/nearby"><b>⌖</b><span>En Yakın Acil</span></Link>
      <Link href="/health-card"><b>▣</b><span>Sağlık Kartım</span></Link>
    </section>

    <section className="home-account-row">
      <Link href="/register?type=patient"><b>Hasta hesabı</b><span>Kişisel sağlık profili</span></Link>
      <Link href="/register?type=doctor"><b>Doktor hesabı</b><span>Alumas Pro</span></Link>
      <Link href="/register?type=organization"><b>Kurum hesabı</b><span>Hastane · Klinik · Eczane</span></Link>
      <Link href="/register?type=agency"><b>Acente hesabı</b><span>Sağlık turizmi</span></Link>
    </section>
  </div>
}
