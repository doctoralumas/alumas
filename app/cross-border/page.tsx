import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("legal");

  return (
    <div className="page">
      <div className="page-title">
        <span className="kicker">{t("legalKicker")}</span>
        <h1>{t("crossBorderTitle")}</h1>
        <p>{t("lastUpdatedNotice")}</p>
      </div>
      <section
        className="panel legal-copy"
        dangerouslySetInnerHTML={{
          __html: t.raw("crossBorderHtml"),
        }}
      />
    </div>
  );
}