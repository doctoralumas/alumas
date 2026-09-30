const fs = require('fs');

const pageFile = 'app/page.tsx';
let pageCode = fs.readFileSync(pageFile, 'utf8');

// Replace Hero structure
const oldHero = `<section className="home-hero" aria-label="Sağlığın için doğru yere">
          <img
            className="home-hero-art"
            src="/assets/home-reference/processed/hero-banner.png?v=3"
            alt=""
            width={2860}
            height={544}
          />
          <div className="home-hero-copy">
            <h1>
              Sağlığın için
              <br />
              doğru yere.
            </h1>
            <p className="home-hero-sub">Doktorları ve sağlık kurumlarını kolayca keşfet.</p>
            <div className="home-hero-accent" />
          </div>
        </section>`;

const newHero = `<section className="home-hero" aria-label="Sağlığın için doğru yere">
          <div className="home-hero-gradient"></div>
          <img
            className="home-hero-doctor"
            src="/assets/home-reference/processed/hero-doctor.png"
            alt=""
          />
          <img
            className="home-hero-kit"
            src="/assets/home-reference/processed/hero-medical-kit-only.png"
            alt=""
          />
          <div className="home-hero-copy">
            <h1>
              Sağlığın için
              <br />
              doğru yere.
            </h1>
            <p className="home-hero-sub">Doktorları ve sağlık kurumlarını kolayca keşfet.</p>
            <div className="home-hero-accent" />
          </div>
        </section>`;

// Because characters might be corrupted by Get-Content, let's use a regex that matches the structure.
pageCode = pageCode.replace(/<section className="home-hero"[\s\S]*?<\/section>/, newHero);

fs.writeFileSync(pageFile, pageCode, 'utf8');
console.log('page.tsx patched');
