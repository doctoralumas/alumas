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
    id: 'experts',
    visual: {
      desktopFit: 'cover',
      desktopPosition: '56% 42%',
      mobileFit: 'cover',
      mobilePosition: '58% 38%',
      scrimStrength: 'normal'
    }
  },
  {
    href: '/organizations',
    title: 'Kurumlar',
    desc: 'Hastane, klinik, eczane',
    image: '/assets/services/institutions.png',
    id: 'institutions',
    visual: {
      desktopFit: 'cover',
      desktopPosition: '50% 58%',
      mobileFit: 'cover',
      mobilePosition: '52% 58%',
      scrimStrength: 'light'
    }
  },
  {
    href: '/nearby',
    title: 'Yakınımdakiler',
    desc: 'Konuma göre keşfet',
    image: '/assets/services/nearby.png',
    id: 'nearby',
    visual: {
      desktopFit: 'cover',
      desktopPosition: '52% 58%',
      mobileFit: 'cover',
      mobilePosition: '55% 60%',
      scrimStrength: 'normal'
    }
  },
  {
    href: '/health-tourism',
    title: 'Sağlık Turizmi',
    desc: 'Uluslararası seçenekler',
    image: '/assets/services/health-tourism.png',
    id: 'tourism',
    visual: {
      desktopFit: 'cover',
      desktopPosition: '55% 48%',
      mobileFit: 'cover',
      mobilePosition: '58% 48%',
      scrimStrength: 'light'
    }
  },
  {
    href: '/health',
    title: 'Sağlığım',
    desc: 'Sağlık takibi',
    image: '/assets/services/my-health.png',
    id: 'health',
    visual: {
      desktopFit: 'cover',
      desktopPosition: '55% 58%',
      mobileFit: 'cover',
      mobilePosition: '58% 56%',
      scrimStrength: 'strong'
    }
  },
  {
    href: '/insurance',
    title: 'Sigorta',
    desc: 'Poliçene uygun',
    image: '/assets/services/insurance.png',
    id: 'insurance',
    visual: {
      desktopFit: 'cover',
      desktopPosition: '56% 58%',
      mobileFit: 'cover',
      mobilePosition: '58% 58%',
      scrimStrength: 'strong'
    }
  },
  {
    href: '/home-care',
    title: 'Evde Sağlık',
    desc: 'Bakım ve destek',
    image: '/assets/services/home-health.png',
    id: 'home',
    visual: {
      desktopFit: 'cover',
      desktopPosition: '52% 48%',
      mobileFit: 'cover',
      mobilePosition: '53% 48%',
      scrimStrength: 'strong'
    }
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
            {SERVICES.map((s) => (
              <Link href={s.href} className="superapp-card" key={s.id}>
                
                <div className="card-image">
                  <img 
                    src={s.image} 
                    alt={s.title} 
                    className={`img-${s.id}`} 
                  />
                </div>
                
                <div className={`card-scrim scrim-${s.visual.scrimStrength}`} />

                <div className="card-text-area">
                  <h2>{s.title}</h2>
                  <p>{s.desc}</p>
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
        
        /* TILE ARCHITECTURE REWRITE */
        .superapp-card {
          background: white;
          border-radius: 20px;
          position: relative;
          overflow: hidden;
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(15,23,42,0.03);
          display: block;
          aspect-ratio: 1 / 1;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .superapp-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(15,23,42,0.06);
        }

        .card-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        .card-image img {
          width: 100%;
          height: 100%;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .superapp-card:hover .card-image img {
          transform: scale(1.02);
        }

        /* SCRIMS / TEXT SAFETY VEILS */
        .card-scrim {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 55%;
          z-index: 2;
          pointer-events: none;
        }

        .scrim-light {
          background: linear-gradient(
            to bottom,
            rgba(255,255,255,0.92) 0%,
            rgba(255,255,255,0.70) 18%,
            rgba(255,255,255,0.30) 35%,
            transparent 50%
          );
        }

        .scrim-normal {
          background: linear-gradient(
            to bottom,
            rgba(255,255,255,0.95) 0%,
            rgba(255,255,255,0.85) 20%,
            rgba(255,255,255,0.50) 40%,
            rgba(255,255,255,0.15) 60%,
            transparent 80%
          );
        }

        .scrim-strong {
          background: linear-gradient(
            to bottom,
            rgba(255,255,255,0.98) 0%,
            rgba(255,255,255,0.92) 25%,
            rgba(255,255,255,0.65) 45%,
            rgba(255,255,255,0.25) 65%,
            transparent 85%
          );
        }

        /* TEXT STYLING */
        .card-text-area {
          position: absolute;
          top: 18px;
          left: 20px;
          right: 18px;
          z-index: 3;
        }

        .card-text-area h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #0b2d50;
          letter-spacing: -0.3px;
          line-height: 1.15;
        }

        .card-text-area p {
          margin: 4px 0 0;
          font-size: 12px;
          line-height: 1.35;
          color: #64778a;
          font-weight: 500;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* PER-CARD ART DIRECTION - DESKTOP */
        .img-experts { object-fit: cover; object-position: 56% 42%; }
        .img-institutions { object-fit: cover; object-position: 50% 58%; }
        .img-nearby { object-fit: cover; object-position: 52% 58%; }
        .img-tourism { object-fit: cover; object-position: 55% 48%; }
        .img-health { object-fit: cover; object-position: 55% 58%; }
        .img-insurance { object-fit: cover; object-position: 56% 58%; }
        .img-home { object-fit: cover; object-position: 52% 48%; }

        /* PER-CARD ART DIRECTION - MOBILE */
        @media (max-width: 768px) {
          .card-text-area {
            top: 12px;
            left: 12px;
            right: 12px;
          }
          .card-text-area h2 {
            font-size: 14px;
          }
          .card-text-area p {
            font-size: 10px;
          }
          
          .img-experts { object-fit: cover; object-position: 58% 38%; }
          .img-institutions { object-fit: cover; object-position: 52% 58%; }
          .img-nearby { object-fit: cover; object-position: 55% 60%; }
          .img-tourism { object-fit: cover; object-position: 58% 48%; }
          .img-health { object-fit: cover; object-position: 58% 56%; }
          .img-insurance { object-fit: cover; object-position: 58% 58%; }
          .img-home { object-fit: cover; object-position: 53% 48%; }
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
