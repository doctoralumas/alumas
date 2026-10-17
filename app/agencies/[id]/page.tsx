import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";

export default async function AgencyProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("search.agencyProfile");
  const locale = await getLocale();

  const agency = await prisma.healthTourismAgency.findFirst({
    where: {
      id,
      status: "APPROVED",
      isVerified: true,
      isActive: true,
      verificationDocuments: { none: { status: "APPROVED", expiresAt: { lt: new Date() } } },
    },
    include: {
      services: { where: { isActive: true }, orderBy: { kind: "asc" } },
      packages: { where: { isPublished: true }, orderBy: { title: "asc" } },
    },
  });

  if (!agency) notFound();

  const numberLocale = locale === "en" ? "en-US" : "tr-TR";

  function getKindLabel(kind: string): string {
    switch (kind) {
      case "TRANSFER":
        return t("kinds.TRANSFER");
      case "ACCOMMODATION":
        return t("kinds.ACCOMMODATION");
      case "TRANSLATION":
        return t("kinds.TRANSLATION");
      case "COORDINATION":
        return t("kinds.COORDINATION");
      case "REFERRAL":
        return t("kinds.REFERRAL");
      default:
        return kind;
    }
  }

  return (
    <div className="page">
      <div className="organization-hero">
        <div className="grow">
          <span className="kicker">{t("kicker")}</span>
          <h1>{agency.name}</h1>
          <p>
            {agency.city || t("cityUnspecified")}
            {agency.phone ? ` · ${agency.phone}` : ""}
          </p>
        </div>
      </div>
      <div className="profile-columns">
        <section className="panel">
          <h2>{t("aboutTitle")}</h2>
          <p>{agency.description || t("noDescription")}</p>
          {!!agency.languages.length && (
            <p>
              {t("languagesLabel")}
              {agency.languages.join(", ")}
            </p>
          )}
          {agency.website && (
            <a href={agency.website} target="_blank" rel="noreferrer">
              {t("website")}
            </a>
          )}
        </section>
        <section className="panel">
          <h2>{t("travelServicesTitle")}</h2>
          <div className="slot-list">
            {agency.services.map((service) => (
              <div className="slot-row" key={service.id}>
                <div>
                  <b>{service.title}</b>
                  <span>
                    {[getKindLabel(service.kind), service.city, service.description]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                {service.price != null && (
                  <strong>
                    {service.price.toLocaleString(numberLocale)} {service.currency}
                  </strong>
                )}
              </div>
            ))}
            {!agency.services.length && <div className="empty">{t("emptyServices")}</div>}
          </div>
        </section>
      </div>
      <section className="panel health-section">
        <h2>{t("packagesTitle")}</h2>
        <div className="slot-list">
          {agency.packages.map((item) => (
            <div className="slot-row" key={item.id}>
              <div>
                <b>{item.title}</b>
                <span>
                  {item.category} · {item.providerName} · {item.city}
                </span>
                <small>{item.description}</small>
              </div>
              {item.startingPrice != null && (
                <strong>
                  {item.startingPrice.toLocaleString(numberLocale)} {item.currency}
                </strong>
              )}
            </div>
          ))}
          {!agency.packages.length && <div className="empty">{t("emptyPackages")}</div>}
        </div>
      </section>
    </div>
  );
}
