import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function AboutPage() {
  const t = await getTranslations("about");

  return (
    <div className="page">
      <div className="page-title">
        <span className="kicker">{t("kicker")}</span>
        <h1>{t("title")}</h1>
        <p>{t("intro")}</p>
      </div>
      <div className="profile-columns">
        <section className="panel">
          <h2>{t("whatWeDoTitle")}</h2>
          <p>{t("whatWeDoDesc")}</p>
          <h2>{t("approachTitle")}</h2>
          <p>{t("approachDesc")}</p>
        </section>
        <section className="panel">
          <h2>{t("trustTitle")}</h2>
          <p>{t("trustDesc")}</p>
          <Link className="secondary" href="/privacy">
            {t("privacyCenter")}
          </Link>
        </section>
      </div>
    </div>
  );
}