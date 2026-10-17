import { getTranslations } from "next-intl/server";

export default async function MaintenancePage() {
  const t = await getTranslations("maintenance");

  return (
    <div className="page">
      <section className="panel maintenance-card">
        <span className="kicker">{t("kicker")}</span>
        <h1>{t("title")}</h1>
        <p>{t("desc")}</p>
        <p className="muted">{t("emergencyNotice")}</p>
        <div className="row wrap">
          <a className="primary" href="/">
            {t("tryAgain")}
          </a>
          <a className="secondary" href="tel:112">
            {t("call112")}
          </a>
        </div>
      </section>
    </div>
  );
}
