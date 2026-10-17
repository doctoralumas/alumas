import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import LiveSearch from "@/components/live-search";
import { homeFont } from "@/lib/home-font";
import { getTranslations } from "next-intl/server";

const CATEGORY_ITEMS = [
  {
    id: "experts",
    href: "/doctors",
    image: "/assets/home-reference/processed/experts-female-doctor.png?v=2",
    fit: "cover",
  },
  {
    id: "institutions",
    href: "/organizations",
    image: "/assets/home-reference/processed/institutions-hospital.png",
    fit: "contain",
  },
  {
    id: "nearby",
    href: "/nearby",
    image: "/assets/home-reference/processed/nearby-location.png",
    fit: "contain",
  },
  {
    id: "tourism",
    href: "/health-tourism",
    image: "/assets/home-reference/processed/health-tourism.png",
    fit: "contain",
  },
  {
    id: "health",
    href: "/health",
    image: "/assets/home-reference/processed/my-health-watch.png",
    fit: "contain",
  },
  {
    id: "insurance",
    href: "/insurance",
    image: "/assets/home-reference/processed/insurance-document.png",
    fit: "contain",
  },
  {
    id: "home",
    href: "/home-care",
    image: "/assets/home-reference/processed/home-health.png",
    fit: "cover",
  },
];

const PROMO_ITEMS = [
  {
    id: "doctor",
    href: "/doctors",
    image: "/assets/home-reference/processed/promo-expert-doctor.png?v=2",
  },
  {
    id: "hospital",
    href: "/organizations",
    image: "/assets/home-reference/processed/promo-hospital.png",
  },
  {
    id: "insurance",
    href: "/insurance",
    image: "/assets/home-reference/processed/promo-insurance.png",
  },
  {
    id: "family",
    href: "https://alumas.vercel.app/health/family-hub",
    image: "/assets/home-reference/processed/family.png",
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

export default async function Home() {
  const t = await getTranslations("home");

  return (
    <div className={`home-page ${homeFont.className}`}>
      <div className="home-shell">
        <LiveSearch />

        <section className="home-hero" aria-label={t("heroAria")}>
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
              <span className="home-hero-line">{t("heroTitleLine1")}</span>
              <br />
              <span className="home-hero-line">{t("heroTitleLine2")}</span>
            </h1>
            <p className="home-hero-sub">{t("heroSubtitle")}</p>
            <div className="home-hero-accent" />
          </div>
        </section>

        <h2 className="home-heading">{t("sectionTitle")}</h2>

        <div className="home-cats">
          {CATEGORY_ITEMS.map((item) => (
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
              <span className="home-cat-label">{t(`categories.${item.id}`)}</span>
            </Link>
          ))}
        </div>

        <div className="home-promos">
          {PROMO_ITEMS.map((item) => {
            const title = t(`promos.${item.id}.title`);
            const description = t(`promos.${item.id}.description`);
            return (
              <Link key={item.id} href={item.href} className="home-promo" data-id={item.id}>
                <div className="home-promo-content">
                  <h3>
                    {title.split("\n").map((line: string) => (
                      <span key={line} style={{ display: "block" }}>
                        {line}
                      </span>
                    ))}
                  </h3>
                  <p>{description}</p>
                  <span className="home-promo-arrow" aria-hidden="true">
                    <ArrowRight size={16} weight="bold" />
                  </span>
                </div>
                <div className="home-promo-visual">
                  <img src={item.image} alt="" />
                </div>
              </Link>
            );
          })}
        </div>

        <footer className="home-footer">
          <Link href="/" className="home-footer-brand" aria-label="ALUMAS">
            <FooterMark />
            ALUMAS
          </Link>
          <nav aria-label={t("footer.legalNav")}>
            <Link href="/privacy">{t("footer.privacy")}</Link>
            <Link href="/cookies">{t("footer.cookies")}</Link>
            <Link href="/terms">{t("footer.terms")}</Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
