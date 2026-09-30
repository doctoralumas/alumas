const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

const NEW_SERVICES = `const SERVICES = [
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
];`;

const startServices = code.indexOf('const SERVICES = [');
const endServices = code.indexOf('export default async function Home() {');
code = code.substring(0, startServices) + NEW_SERVICES + '\n\n' + code.substring(endServices);

const newGrid = `          <div className="superapp-unified-grid">
            {SERVICES.map((s) => (
              <Link href={s.href} className="superapp-card" key={s.id}>
                
                <div className="card-image">
                  <img 
                    src={s.image} 
                    alt={s.title} 
                    className={\`img-\${s.id}\`} 
                  />
                </div>
                
                <div className={\`card-scrim scrim-\${s.visual.scrimStrength}\`} />

                <div className="card-text-area">
                  <h2>{s.title}</h2>
                  <p>{s.desc}</p>
                </div>

              </Link>
            ))}
          </div>`;

const startGrid = code.indexOf('<div className="superapp-unified-grid">');
const endGrid = code.indexOf('</div>\n\n        </div>\n      </section>');
code = code.substring(0, startGrid) + newGrid + code.substring(endGrid);

// CSS Replacement
const startCSS = code.indexOf('/* EXPLICIT TILE TERRITORIES */');
const endCSS = code.indexOf('/* 4. TRUST SECTION */');

const newCSS = `/* TILE ARCHITECTURE REWRITE */
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

        `;

code = code.substring(0, startCSS) + newCSS + code.substring(endCSS);

fs.writeFileSync('app/page.tsx', code);
console.log('Update Complete.');
