import Link from "next/link";
import { Search } from "@/components/icons";

const tiles = [
  {href:"/health", kicker:"Kişisel sağlık", title:"SAĞLIĞIM", text:"Tüm sağlık verilerin tek yerde", cls:"home-tile span7 row2", image:"/home-visuals/health_watch.webp"},
  {href:"/doctors", kicker:"Uzmanlar", title:"DOKTOR BUL", text:"Uzman doktorları bul ve randevu al", cls:"home-tile span5 row2", image:"https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80"},
  {href:"/nearby", kicker:"Konum", title:"YAKINIMDAKİLER", text:"Hastane, klinik, eczane, acil ve oteller", cls:"home-tile span4 row2", image:"https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80"},
  {href:"/home-care", kicker:"Alumas Care", title:"EVDE SAĞLIK", text:"Doktor, hemşirelik veya numune alma", cls:"home-tile span4 row2", image:"https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80"},
  {href:"/emergency", kicker:"Acil erişim", title:"ACİL / 112", text:"Acil servis, ambulans ve sağlık kartına hızlı eriş", cls:"home-tile emergency span4 row2", image:"/home-visuals/emergency_siren.webp"},
  {href:"/health-tourism", kicker:"Uluslararası sağlık", title:"SAĞLIK TURİZMİ", text:"Tedavi, konaklama ve ulaşım hizmetleri", cls:"home-tile navy span8 row2", image:"https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80"},
  {href:"/organizations", kicker:"Kurumlar", title:"HASTANE & KLİNİK", text:"Doğrulanmış sağlık kurumlarını keşfet", cls:"home-tile span4 row2", image:"https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80"},
  {href:"/health/cycle", kicker:"Kadın sağlığı", title:"REGL TAKİBİ", text:"Döngünü, akışını ve belirtilerini takip et", cls:"home-tile span4 row2", image:"/home-visuals/pink_cycle.webp"},
  {href:"/health/medications", kicker:"Takip", title:"İLAÇLARIM", text:"İlaçlarını yönet ve hatırlatıcı kur", cls:"home-tile span4 row2", image:"/home-visuals/colorful_pills.webp"},
  {href:"/health/labs", kicker:"Sonuçlar", title:"LABORATUVAR", text:"Tahlil sonuçlarını ve trendlerini görüntüle", cls:"home-tile span4 row2", image:"https://images.unsplash.com/photo-1579165466741-7f35e4755660?auto=format&fit=crop&w=800&q=80"},
  {href:"/insurance", kicker:"Kapsam", title:"SİGORTALARIM", text:"Poliçe ve anlaşmalı kurumlarını yönet", cls:"home-tile span4 row2", image:"https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"},
  {href:"/calendar", kicker:"Plan", title:"TAKVİM", text:"Randevu ve hatırlatıcılarını gör", cls:"home-tile span4 row2", image:"https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=800&q=80"},
  {href:"/health-card", kicker:"Acil sağlık özeti", title:"SAĞLIK KARTIM", text:"Önemli sağlık bilgilerini kontrollü paylaş", cls:"home-tile span4 row2", image:"/home-visuals/health_card_neon.webp"},
  {href:"/profile", kicker:"Hesap", title:"PROFİL & HESAPLAR", text:"Hasta, doktor, kurum ve sağlık turizmi profillerini yönet", cls:"home-tile span4 row2", image:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"}
];

import { currentUser } from "@/lib/auth";

export default async function Home(){
  const user = await currentUser();

  return <div className="page home-getir">
    <section className="home-getir-location">
      <div><span className="home-location-pin">⌖</span><div><small>Konum</small><b>Yakınımdaki sağlık hizmetleri</b></div></div>
      <div className="home-location-actions"><Link href="/nearby">Değiştir</Link></div>
    </section>

    <section className="home-getir-hero home-getir-hero-with-image">
      <div className="home-hero-copy">
        <span>ALUMAS</span>
        <h1>Sağlığın için<br/>her şey tek yerde.</h1>
        <p>Sağlık kayıtların, randevuların ve ihtiyaçların Alumas’ta.</p>
        <Link className="home-search" href="/ai"><Search/> Asistan ile Keşfet</Link>
      </div>
      <img className="home-hero-image" src="https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=1200&q=80" alt="Alumas Health"/>
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
      <Link href="/nearby"><b>📍</b><span>En Yakın Acil</span></Link>
      <Link href="/health-card"><b>🪪</b><span>Sağlık Kartım</span></Link>
    </section>

    {!user && (
      <section className="home-account-row" style={{ marginTop: '24px' }}>
        <Link href="/register"><b>Hasta hesabı</b><span>Kişisel sağlık profili</span></Link>
        <Link href="/pro/register?type=doctor"><b>Doktor hesabı</b><span>Alumas Pro</span></Link>
        <Link href="/pro/register?type=organization"><b>Kurum hesabı</b><span>Hastane · Klinik · Eczane</span></Link>
        <Link href="/pro/register?type=agency"><b>Sağlık Turizmi</b><span>Acente & Koordinasyon</span></Link>
      </section>
    )}
  </div>
}
