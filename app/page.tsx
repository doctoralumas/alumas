import Link from 'next/link';
import { ShieldCheck, FileText, LockKey } from '@phosphor-icons/react/dist/ssr';
import { currentUser } from '@/lib/auth';
import LiveSearch from '@/components/live-search';
import CampaignCarousel from '@/components/ui/campaign-carousel';


const SERVICES = [
  {
    href: '/doctors',
    title: 'Uzmanlar',
    desc: 'Doktor ve uzmanlar',
    image: '/assets/services/experts.png',
    id: 'experts'
  },
  {
    href: '/organizations',
    title: 'Kurumlar',
    desc: 'Hastane, klinik, eczane',
    image: '/assets/services/institutions.png',
    id: 'institutions'
  },
  {
    href: '/nearby',
    title: 'Yakınımdakiler',
    desc: 'Konuma göre keşfet',
    image: '/assets/services/nearby.png',
    id: 'nearby'
  },
  {
    href: '/health-tourism',
    title: 'Sağlık Turizmi',
    desc: 'Uluslararası seçenekler',
    image: '/assets/services/health-tourism.png',
    id: 'tourism'
  },
  {
    href: '/health',
    title: 'Sağlığım',
    desc: 'Sağlık takibi',
    image: '/assets/services/my-health.png',
    id: 'health'
  },
  {
    href: '/insurance',
    title: 'Sigorta',
    desc: 'Poliçene uygun',
    image: '/assets/services/insurance.png',
    id: 'insurance'
  },
  {
    href: '/home-care',
    title: 'Evde Sağlık',
    desc: 'Bakım ve destek',
    image: '/assets/services/home-health.png',
    id: 'home'
  }
];

export default async function Home() {
  const user = await currentUser();

  return (
    <main className="superapp-home">
      
      {/* 
        1. CAMPAIGN HERO CAROUSEL 
        Premium data-driven slide component
      */}
      <CampaignCarousel />

      {/* 
        2. SEARCH MODULE (DESKTOP ONLY)
        Hidden on mobile to preserve app-like hierarchy
      */}
      <section className="superapp-search-section desktop-only-search">
        <div className="superapp-container">
          <LiveSearch />
        </div>
      </section>

      {/* 
        3. SERVICE TILE SYSTEM
        Unified 2-column grid, tall cards, white backgrounds, large cutout imagery
      */}
      <section className="superapp-services-section">
        <div className="superapp-container">
          
                    <div className="superapp-unified-grid">
            {SERVICES.map((s, i) => (
              <Link href={s.href} className={`superapp-card service-card-${s.id}`} key={s.id}>
                <div className="card-text-area">
                  <h2 className={s.id === 'experts' ? 'doctor-card-title' : ''}>{s.title}</h2>
                  <p className={s.id === 'experts' ? 'doctor-card-title' : ''}>{s.desc}</p>
                </div>
                <div className="card-visual-area">
                  <img src={s.image} alt={s.title} className={`service-img visual-${s.id}`} />
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* 
        4. TRUST SECTION 
      */}
      <section className="superapp-trust-section">
        <div className="superapp-container">
          <div className="superapp-trust-module">
            <div className="trust-header">
              <h2>Güvenle Karar Ver</h2>
            </div>
            
            <div className="trust-grid">
              <div className="trust-item">
                <div className="trust-icon-box"><ShieldCheck size={24} weight="fill" /></div>
                <div className="trust-content">
                  <h4>Doğrulanmış kurumlar</h4>
                  <p>Sadece güvenilir onaylı kuruluşlar</p>
                </div>
              </div>
              <div className="trust-item">
                <div className="trust-icon-box"><FileText size={24} weight="fill" /></div>
                <div className="trust-content">
                  <h4>Şeffaf bilgiler</h4>
                  <p>Hizmetler hakkında net bilgi</p>
                </div>
              </div>
              <div className="trust-item">
                <div className="trust-icon-box"><LockKey size={24} weight="fill" /></div>
                <div className="trust-content">
                  <h4>Kişisel veriler güvende</h4>
                  <p>KVKK standartlarına uygun</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        /* BASE SYSTEM */
        .superapp-home {
          background-color: #f8fafc; /* Very light cool gray */
          min-height: 100vh;
          padding-bottom: 100px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .superapp-container {
          max-width: 1360px;
          margin: 0 auto;
          padding: 0 24px;
        }
        @media (min-width: 1600px) {
          .superapp-container {
            max-width: 1400px;
          }
        }
        @media (max-width: 768px) {
          .superapp-container {
            padding: 0 16px;
          }
        }

        /* 1. CAMPAIGN CAROUSEL */

        /* 2. SEARCH MODULE (Desktop Only) */
        .superapp-search-section {
          margin-bottom: 40px;
        }
        .desktop-only-search {
          display: block;
        }

        /* 3. SERVICE TILES */
        .superapp-services-section {
          margin-bottom: 48px;
        }
        .superapp-unified-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        /* TILE ARCHITECTURE */
        .superapp-card {
          background: white;
          border-radius: 20px;
          position: relative;
          overflow: hidden;
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(15,23,42,0.03);
          display: flex;
          flex-direction: column;
          aspect-ratio: 1 / 1; /* Pure squares on desktop too for density */
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .superapp-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(15,23,42,0.06);
        }
        
        /* EXPLICIT TILE TERRITORIES */
        .card-text-area {
          padding: 18px 20px 0 18px;
          position: relative;
          z-index: 2;
          flex: 0 0 auto;
        }
        .card-visual-area {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }
        
        /* TEXT STYLING */
        .superapp-card h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #0b2d50;
          letter-spacing: -0.3px;
          line-height: 1.15;
        }
        .doctor-card-title {
          max-width: 42%;
        }
        
        .superapp-card p {
          margin: 4px 0 0;
          font-size: 12px;
          line-height: 1.35;
          color: #64778a;
          font-weight: 500;
        }

        /* IMAGE STYLING: OBJECT-BASED COMPOSITION */
        .service-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .superapp-card:hover .service-img {
          transform: scale(1.03);
        }

        /* PER-CARD ART DIRECTION */
        .visual-experts {
          object-position: 70% 85%;
        }
        .visual-institutions {
          object-position: center bottom;
        }
        .visual-nearby {
          object-position: center bottom;
        }
        .visual-tourism {
          object-position: center 60%;
        }
        .visual-health {
          object-position: 70% 80%;
        }
        .visual-insurance {
          object-position: 80% 80%;
        }
        .visual-home {
          object-position: center 80%;
        }

        /* MOBILE ART DIRECTION */
        @media (max-width: 768px) {
          .visual-experts { object-position: 70% 90%; }
          .visual-institutions { object-position: center bottom; }
          .visual-nearby { object-position: center bottom; }
          .visual-tourism { object-position: center 70%; }
          .visual-health { object-position: 70% 80%; }
          .visual-insurance { object-position: 80% 80%; }
          .visual-home { object-position: center 90%; }
        }

        /* 4. TRUST SECTION */
        .superapp-trust-section {
          margin-bottom: 40px;
        }
        .superapp-trust-module {
          background: white;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 16px rgba(15,23,42,0.03);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .trust-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: #0b2545;
        }
        .trust-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .trust-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .trust-icon-box {
          background: #f8fafc;
          color: #0ea5e9;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .trust-content h4 {
          margin: 0 0 2px 0;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }
        .trust-content p {
          margin: 0;
          font-size: 13px;
          color: #64748b;
          line-height: 1.4;
        }

        /* RESPONSIVENESS */
        @media (max-width: 1024px) {
          .superapp-unified-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        @media (max-width: 768px) {
          .desktop-only-search {
            display: none !important;
          }

          .superapp-unified-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .superapp-card {
            border-radius: 18px;
            aspect-ratio: 1 / 1.1; /* Slightly taller than square */
          }
          .card-text-area {
            padding: 12px 12px 0 12px;
          }
          .superapp-card h2 { 
            font-size: 13.5px;
            line-height: 1.15;
          }
          .doctor-card-title {
            max-width: 60%; /* Allow wider area on mobile for clean 2-line wrap */
          }
          .superapp-card p {
            font-size: 10.5px;
            line-height: 1.25;
            margin-top: 4px;
          }
          
          /* Visual dominance in mobile tiles */
          .card-visual-area {
            height: 75%;
          }
          .card-visual-area img {
            width: 110%;
            height: 110%;
            right: -5%;
            bottom: 0;
            object-fit: contain;
            mix-blend-mode: darken;
          }
          .card-visual-area img.env-visual {
            width: 100%;
            height: 100%;
            right: 0;
            left: 0;
            object-fit: cover;
            mix-blend-mode: normal;
          }
          
          /* MOBILE-SPECIFIC COLLISION & INTEGRATION FIXES */
          
          .card-visual-area img.doctor-visual {
            width: 155%;
            height: 155%;
            right: -32%;
            bottom: -32%; /* Pulled further down to avoid text collision */
          }
          
          .card-visual-area img.insurance-visual {
            width: 160%;
            height: 160%;
            right: -30%;
            bottom: -30%; /* Protects title area while keeping scale large enough to hide frame */
          }
          
          .card-visual-area img.nearby-visual {
            width: 130%;
            height: 130%;
            right: -5%;
            bottom: -15%;
          }
          
          /* MOBILE STRUCTURAL FIX FOR ENVIRONMENTAL CARDS */
          .superapp-card:has(.hospital-visual) .card-visual-area,
          .superapp-card:has(.home-health-visual) .card-visual-area {
            height: 100%; /* Full bleed architectural change */
          }
          
          /* Subtle white scrim layered between image and title */
          .superapp-card:has(.hospital-visual) .card-visual-area::after,
          .superapp-card:has(.home-health-visual) .card-visual-area::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 20%, rgba(255,255,255,0) 45%);
            z-index: 1;
            pointer-events: none;
          }

          /* Ensure text area stays above the scrim */
          .superapp-card:has(.hospital-visual) .card-text-area,
          .superapp-card:has(.home-health-visual) .card-text-area {
            position: relative;
            z-index: 2;
          }
          
          /* Remove previous massive hacks, use full-bleed structure */
          .card-visual-area img.hospital-visual,
          .card-visual-area img.home-health-visual {
            width: 125%; /* Small zoom only to crop the drawn frame inside the original JPEG */
            height: 125%;
            right: -12.5%;
            bottom: -12.5%;
            left: auto;
            object-fit: cover;
            mix-blend-mode: normal;
            -webkit-mask-image: none;
            mask-image: none;
            filter: none;
            z-index: 0;
          }
          
          .card-visual-area img.hospital-visual {
            object-position: 50% 80%; /* Keeps architectural context and reception visible */
          }
          
          .card-visual-area img.home-health-visual {
            object-position: 50% 65%; /* Keeps both faces and interaction perfectly visible */
          }
          
          .card-visual-area img.health-visual {
            width: 120%;
            height: 120%;
            right: -10%;
            bottom: -10%;
          }
          
          /* Trust */
          .superapp-trust-module {
            padding: 24px 16px;
            border-radius: 20px;
          }
          .trust-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
      `}} />
    </main>
  );
}
