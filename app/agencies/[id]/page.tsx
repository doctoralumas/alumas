import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AgencyProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agency = await prisma.healthTourismAgency.findFirst({
    where: { id, status: "APPROVED", isVerified: true, isActive: true, verificationDocuments: { none: { status: "APPROVED", expiresAt: { lt: new Date() } } } },
    include: {
      services: { where: { isActive: true }, orderBy: { kind: "asc" } },
      packages: { where: { isPublished: true }, orderBy: { title: "asc" } },
    },
  });
  if (!agency) notFound();
  const kinds: Record<string, string> = {
    TRANSFER: "Transfer",
    ACCOMMODATION: "Konaklama",
    TRANSLATION: "Tercüman",
    COORDINATION: "Koordinasyon",
    REFERRAL: "Partner yönlendirme",
  };
  return (
    <div className="page">
      <div className="organization-hero">
        <div className="grow">
          <span className="kicker">Doğrulanmış sağlık turizmi acentesi</span>
          <h1>{agency.name}</h1>
          <p>{agency.city || "Şehir belirtilmedi"}{agency.phone ? ` · ${agency.phone}` : ""}</p>
        </div>
      </div>
      <div className="profile-columns">
        <section className="panel">
          <h2>Hakkında</h2>
          <p>{agency.description || "Acente açıklaması henüz eklenmedi."}</p>
          {!!agency.languages.length && <p>Diller: {agency.languages.join(", ")}</p>}
          {agency.website && <a href={agency.website} target="_blank" rel="noreferrer">Web sitesi</a>}
        </section>
        <section className="panel">
          <h2>Seyahat hizmetleri</h2>
          <div className="slot-list">
            {agency.services.map((service) => (
              <div className="slot-row" key={service.id}>
                <div>
                  <b>{service.title}</b>
                  <span>{[kinds[service.kind] || service.kind, service.city, service.description].filter(Boolean).join(" · ")}</span>
                </div>
                {service.price != null && <strong>{service.price.toLocaleString("tr-TR")} {service.currency}</strong>}
              </div>
            ))}
            {!agency.services.length && <div className="empty">Yayında hizmet yok.</div>}
          </div>
        </section>
      </div>
      <section className="panel health-section">
        <h2>Tedavi ve seyahat paketleri</h2>
        <div className="slot-list">
          {agency.packages.map((item) => (
            <div className="slot-row" key={item.id}>
              <div>
                <b>{item.title}</b>
                <span>{item.category} · {item.providerName} · {item.city}</span>
                <small>{item.description}</small>
              </div>
              {item.startingPrice != null && <strong>{item.startingPrice.toLocaleString("tr-TR")} {item.currency}</strong>}
            </div>
          ))}
          {!agency.packages.length && <div className="empty">Yayında paket yok.</div>}
        </div>
      </section>
    </div>
  );
}
