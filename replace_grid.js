const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

const SERVICES_ARRAY = `
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
`;

const newGrid = `          <div className="superapp-unified-grid">
            {SERVICES.map((s, i) => (
              <Link href={s.href} className={\`superapp-card service-card-\${s.id}\`} key={s.id}>
                <div className="card-text-area">
                  <h2 className={s.id === 'experts' ? 'doctor-card-title' : ''}>{s.title}</h2>
                  <p className={s.id === 'experts' ? 'doctor-card-title' : ''}>{s.desc}</p>
                </div>
                <div className="card-visual-area">
                  <img src={s.image} alt={s.title} className={\`service-img visual-\${s.id}\`} />
                </div>
              </Link>
            ))}
          </div>`;

const startIndex = code.indexOf('<div className="superapp-unified-grid">');
const endIndex = code.indexOf('</div>\n\n        </div>\n      </section>');

let newCode = code.substring(0, startIndex) + newGrid + code.substring(endIndex + 6);
newCode = newCode.replace('export default async function Home() {', SERVICES_ARRAY + '\nexport default async function Home() {');

// Now replace the CSS rules!
const cssStart = newCode.indexOf('/* EXPLICIT TILE TERRITORIES */');
const cssEnd = newCode.indexOf('/* 4. TRUST SECTION */');

const newCSS = `/* EXPLICIT TILE TERRITORIES */
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
          object-position: 70% 30%;
        }
        .visual-insurance {
          object-position: 60% 40%;
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
          .visual-health { object-position: 60% 30%; }
          .visual-insurance { object-position: 70% 50%; }
          .visual-home { object-position: center 90%; }
        }

        `;

newCode = newCode.substring(0, cssStart) + newCSS + newCode.substring(cssEnd);

fs.writeFileSync('app/page.tsx', newCode);
console.log('Done!');
