import Link from 'next/link';
import { ShieldCheck, FileText, LockKey } from '@phosphor-icons/react/dist/ssr';
import { currentUser } from '@/lib/auth';
import LiveSearch from '@/components/live-search';
import CampaignCarousel from '@/components/ui/campaign-carousel';

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
            
            <Link href="/doctors" className="superapp-card">
              <div className="card-text-area">
                <h2 className="doctor-card-title">Doktor & Uzman</h2>
              </div>
              <div className="card-visual-area">
                <img src="/assets/services/3.jpg?v=2" alt="Doktor ve Uzman" className="doctor-visual" />
              </div>
            </Link>

            <Link href="/organizations" className="superapp-card">
              <div className="card-text-area">
                <h2>Hastane & Klinik</h2>
              </div>
              <div className="card-visual-area">
                <img src="/assets/services/hospital.jpg" alt="Hastane ve Klinik İçi" className="env-visual hospital-visual" />
              </div>
            </Link>

            <Link href="/nearby" className="superapp-card">
              <div className="card-text-area">
                <h2>Yakınımdakiler</h2>
                <p>Yakınında keşfet</p>
              </div>
              <div className="card-visual-area">
                <img src="/assets/services/nearby.jpg" alt="Yakınımdakiler Harita" className="nearby-visual" />
              </div>
            </Link>

            <Link href="/health-tourism" className="superapp-card">
              <div className="card-text-area">
                <h2>Sağlık Turizmi</h2>
                <p>Uluslararası seçenekler</p>
              </div>
              <div className="card-visual-area">
                <img src="/assets/services/2.jpg?v=2" alt="Sağlık Turizmi Seyahat" className="env-visual tourism-visual" />
              </div>
            </Link>

            <Link href="/health" className="superapp-card">
              <div className="card-text-area">
                <h2>Sağlığım</h2>
                <p>Sağlık takibi</p>
              </div>
              <div className="card-visual-area">
                <img src="/assets/services/my-health.jpg" alt="Sağlık takibi için akıllı saat" className="health-visual" />
              </div>
            </Link>

            <Link href="/insurance" className="superapp-card">
              <div className="card-text-area">
                <h2>Sigortama Uygun</h2>
                <p>Poliçene göre</p>
              </div>
              <div className="card-visual-area">
                <img src="/assets/services/1.jpg?v=2" alt="Sigorta Uygulaması" className="insurance-visual" />
              </div>
            </Link>

            <Link href="/home-care" className="superapp-card">
              <div className="card-text-area">
                <h2>Evde Sağlık</h2>
              </div>
              <div className="card-visual-area">
                <img src="/assets/services/home-health.jpg" alt="Evde Sağlık Bakımı" className="env-visual home-health-visual" />
              </div>
            </Link>

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
          bottom: 0;
          left: 0;
          width: 100%;
          height: 75%; /* Dominant visual area 75% */
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
        .card-visual-area img {
          position: absolute;
          bottom: 0;
          right: -5%;
          width: 110%; /* Scale up significantly */
          height: 110%;
          object-fit: contain; 
          object-position: bottom right;
          mix-blend-mode: darken; /* Makes white background invisible */
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-visual-area img.env-visual {
          width: 100%;
          height: 100%;
          right: 0;
          object-fit: cover;
          object-position: bottom center;
          mix-blend-mode: normal; /* Env visuals do not darken */
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 20%);
          mask-image: linear-gradient(to bottom, transparent 0%, black 20%);
          border-bottom-left-radius: 20px;
          border-bottom-right-radius: 20px;
        }

        /* SPECIFIC IMAGE CROPPING & INTEGRATION TO REMOVE INNER-CARD FEELING */
        
        .card-visual-area img.doctor-visual {
          width: 165%;
          height: 165%;
          right: -32%;
          bottom: -20%;
          object-position: center bottom;
          filter: contrast(1.04) brightness(1.02);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 20%);
          mask-image: linear-gradient(to right, transparent 0%, black 20%);
        }

        .card-visual-area img.insurance-visual {
          width: 165%; /* Extreme zoom to push baked-in JPEG frame out of view */
          height: 165%;
          right: -28%;
          bottom: -22%;
          object-position: center center;
        }

        .card-visual-area img.nearby-visual {
          width: 140%; /* Reduced slightly from 150% to prevent cramping */
          height: 140%;
          right: -8%; /* Shifted ~12% left for optical centering */
          bottom: -10%; /* Comfortable bottom anchor */
          filter: contrast(1.04) brightness(1.02);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 25%);
          mask-image: linear-gradient(to bottom, transparent 0%, black 25%);
        }

        .card-visual-area img.health-visual {
          width: 125%;
          height: 125%;
          right: -10%;
          bottom: -5%;
        }
        
        /* Hospital and Home-Health have baked-in rounded frames in the JPEG. Zoom in heavily to crop them out. */
        .card-visual-area img.hospital-visual {
          width: 155%; /* Safe scale to crop frame but retain architectural context */
          height: 155%;
          right: -27.5%;
          left: auto;
          bottom: -25%;
          object-position: center bottom;
          -webkit-mask-image: linear-gradient(to bottom, transparent 15%, black 40%);
          mask-image: linear-gradient(to bottom, transparent 15%, black 40%);
        }

        .card-visual-area img.home-health-visual {
          width: 125%;
          height: 125%;
          right: -12.5%;
          left: auto;
          bottom: -12.5%;
          object-position: center bottom;
        }

        .superapp-card:hover .card-visual-area img {
          transform: scale(1.04) translateY(-2%);
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
