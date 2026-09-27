import Link from 'next/link';
import { MagnifyingGlass, Sparkle, CaretRight, ArrowRight, ShieldCheck, FileText, LockKey, Stethoscope, Hospital, Shield, HouseLine, MapPin, AirplaneTilt, Heart, FirstAidKit } from '@phosphor-icons/react/dist/ssr';
import { currentUser } from '@/lib/auth';
import LiveSearch from '@/components/live-search';

export default async function Home(){
  const user = await currentUser();

  return (
    <main className="new-home-layout">
      
      {/* HERO SECTION */}
      <section className="new-hero">
        <div className="new-hero-bg">
          <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1600&q=80" alt="Alumas Health Platform" />
        </div>
        <div className="new-hero-content">
          <h1>Sağlığın için<br/>doğru adresi bul.</h1>
          <p>İhtiyacını anlat, sana uygun sağlık hizmetini keşfet.</p>
          
          <LiveSearch />
        </div>
      </section>

      {/* QUICK LINKS */}
      <section className="new-quick-links">
        <Link href="/doctors" className="ql-card">
          <div className="ql-icon doctor"><Stethoscope size={28} weight="duotone" /></div>
          <span>Doktor Bul</span>
          <CaretRight size={16} weight="bold" className="chevron" />
        </Link>
        <Link href="/organizations" className="ql-card">
          <div className="ql-icon hospital"><Hospital size={28} weight="duotone" /></div>
          <span>Hastane & Klinik</span>
          <CaretRight size={16} weight="bold" className="chevron" />
        </Link>
        <Link href="/insurance" className="ql-card">
          <div className="ql-icon insurance"><Shield size={28} weight="duotone" /></div>
          <span>Sigortama Uygun</span>
          <CaretRight size={16} weight="bold" className="chevron" />
        </Link>
        <Link href="/home-care" className="ql-card">
          <div className="ql-icon home"><HouseLine size={28} weight="duotone" /></div>
          <span>Evde Sağlık</span>
          <CaretRight size={16} weight="bold" className="chevron" />
        </Link>
      </section>

      {/* DISCOVER SECTION */}
      <section className="new-discover">
        <div className="discover-header">
          <h2>Sağlık hizmetlerini keşfet</h2>
          <Link href="/services">Tüm hizmetleri gör <ArrowRight size={16} weight="bold" /></Link>
        </div>
        
        <div className="discover-grid">
          <Link href="/nearby" className="discover-card">
            <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80" alt="Yakınımdakiler" />
            <div className="dc-content">
              <div className="dc-icon map"><MapPin size={24} weight="fill" /></div>
              <div className="dc-text">
                <b>Yakınımdakiler</b>
                <span>Sana en yakın doktor, hastane ve klinikleri keşfet.</span>
              </div>
              <CaretRight size={18} weight="bold" className="chevron" />
            </div>
          </Link>

          <Link href="/emergency" className="discover-card">
            <img src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80" alt="Acil & Nöbetçi" />
            <div className="dc-content">
              <div className="dc-icon flight" style={{ background: '#fef2f2', color: '#ef4444' }}><FirstAidKit size={24} weight="fill" /></div>
              <div className="dc-text">
                <b>Acil & Nöbetçi</b>
                <span>Nöbetçi eczaneler ve acil sağlık hizmetleri.</span>
              </div>
              <CaretRight size={18} weight="bold" className="chevron" />
            </div>
          </Link>

          <Link href="/health" className="discover-card">
            <img src="/home-visuals/health_watch.webp" alt="Sağlığım" />
            <div className="dc-content">
              <div className="dc-icon heart"><Heart size={24} weight="fill" /></div>
              <div className="dc-text">
                <b>Sağlığım</b>
                <span>Kendin ve sevdiklerin için sağlık çözümleri.</span>
              </div>
              <CaretRight size={18} weight="bold" className="chevron" />
            </div>
          </Link>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="new-trust">
        <div className="trust-main">
          <h2>Güvenle karar ver</h2>
          <p>Sağlık yolculuğunda yanında. Doğru bilgi, güvenilir sağlık kurumları ve senin için daha fazla güvenlik.</p>
        </div>
        <div className="trust-grid">
          <div className="trust-item">
            <ShieldCheck size={32} weight="duotone" className="trust-icon" />
            <div>
              <b>Doğrulanmış kurumlar</b>
              <span>Sadece güvenilir ve onaylı sağlık kuruluşları</span>
            </div>
          </div>
          <div className="trust-item">
            <FileText size={32} weight="duotone" className="trust-icon" />
            <div>
              <b>Şeffaf bilgiler</b>
              <span>Hizmetler, uzmanlıklar ve olanaklar hakkında net bilgi</span>
            </div>
          </div>
          <div className="trust-item">
            <LockKey size={32} weight="duotone" className="trust-icon" />
            <div>
              <b>Kişisel verilerin güvende</b>
              <span>Verilerin KVKK standartlarına uygun şekilde korunur</span>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
