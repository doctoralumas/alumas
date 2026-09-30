import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import LiveSearch from "@/components/live-search";
import { homeFont } from "@/lib/home-font";

const CATEGORIES = [
  {
    id: "experts",
    href: "/doctors",
    title: "Uzmanlar",
            image: "/assets/home-reference/processed/experts-female-doctor.png?v=2",
    fit: "cover",
  },
  {
    id: "institutions",
    href: "/organizations",
    title: "Kurumlar",
    image: "/assets/home-reference/processed/institutions-hospital.png",
    fit: "contain",
  },
  {
    id: "nearby",
    href: "/nearby",
    title: "Yakınımdakiler",
    image: "/assets/home-reference/processed/nearby-location.png",
    fit: "contain",
  },
  {
    id: "tourism",
    href: "/health-tourism",
    title: "Sağlık Turizmi",
    image: "/assets/home-reference/processed/health-tourism.png",
    fit: "contain",
  },
  {
    id: "health",
    href: "/health",
    title: "Sağlığım",
    image: "/assets/home-reference/processed/my-health-watch.png",
    fit: "contain",
  },
  {
    id: "insurance",
    href: "/insurance",
    title: "Sigorta",
    image: "/assets/home-reference/processed/insurance-document.png",
    fit: "contain",
  },
  {
    id: "home",
    href: "/home-care",
    title: "Evde Sağlık",
    image: "/assets/home-reference/processed/home-health.png",
    fit: "cover",
  },
];

const PROMOS = [
  {
    id: "doctor",
    href: "/doctors",
    title: "Uzmanını bul",
    description: "Branşına göre doktorları keşfet.",
    image: "/assets/home-reference/processed/promo-expert-doctor.png?v=2",
  },
  {
    id: "hospital",
    href: "/organizations",
    title: "Yakınındaki kurumlar",
    description: "Hastane ve klinikleri incele.",
    image: "/assets/home-reference/processed/promo-hospital.png",
  },
  {
    id: "insurance",
    href: "/insurance",
    title: "Sigortana uygun\nseçenekler",
    description: "Anlaşmalı kurumları keşfet.",
    image: "/assets/home-reference/processed/promo-insurance.png",
  },
];

function FooterMark() {
  return (
    <svg className="home-brand-mark" width="22" height="14" viewBox="0 0 36 18" aria-hidden="true">
      <path
        d="M1 10h6.2l2.2-6.2L13 16l3.1-9.2L18.4 10H35"
        fill="none"
        stroke="#16344e"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <div className={`home-page ${homeFont.className}`}>
      <div className="home-shell">
        <LiveSearch />

        <section className="home-hero" aria-label="Sağlığın için doğru yere">
          <div className="home-hero-gradient"></div>
          <img
            className="home-hero-doctor"
            src="/assets/home-reference/processed/hero-doctor-cutout.png"
            alt=""
          />
          <img
            className="home-hero-kit"
            src="/assets/home-reference/processed/hero-medical-kit-cutout.png"
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
        </section>

        <h2 className="home-heading">Neye ihtiyacın var?</h2>

        <div className="home-cats">
          {CATEGORIES.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="home-cat"
              data-id={item.id}
              data-fit={item.fit}
            >
              <div className="home-cat-visual">
                <img src={item.image} alt="" />
              </div>
              <span className="home-cat-label">{item.title}</span>
            </Link>
          ))}
        </div>

        <div className="home-promos">
          {PROMOS.map((item) => (
            <Link key={item.id} href={item.href} className="home-promo" data-id={item.id}>
              <h3>
                {item.title.split("\n").map((line) => (
                  <span key={line} style={{ display: "block" }}>
                    {line}
                  </span>
                ))}
              </h3>
              <p>{item.description}</p>
              <span className="home-promo-arrow" aria-hidden="true">
                <ArrowRight size={16} weight="bold" />
              </span>
              <img src={item.image} alt="" />
            </Link>
          ))}
        </div>

        <footer className="home-footer">
          <Link href="/" className="home-footer-brand" aria-label="ALUMAS">
            <FooterMark />
            ALUMAS
          </Link>
          <nav aria-label="Yasal">
            <Link href="/privacy">KVKK</Link>
            <Link href="/cookies">Çerezler</Link>
            <Link href="/terms">Kullanım Koşulları</Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
