import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const rows = await prisma.healthTourismAgency.findMany({
    where: { ownerUserId: user.id },
    include: { _count: { select: { packages: { where: { isPublished: true } }, services: { where: { isActive: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page workspace">
      <div className="page-title row between">
        <div>
          <span className="kicker">Sağlık turizmi paneli</span>
          <h1>Sağlık turizmi hesaplarım</h1>
          <p>Paketlerini ve koordinasyon hizmetlerini buradan yönet.</p>
        </div>
        <Link className="primary" href="/agency/apply">+ Profil oluştur</Link>
      </div>
      <div className="business-list">
        {rows.map((agency) => (
          <section className="panel" key={agency.id}>
            <div className="row between">
              <div>
                <span className="kicker">Sağlık turizmi profili</span>
                <h2>{agency.name}</h2>
                <p>{agency.city}</p>
              </div>
              <span className={`status org-${agency.status.toLowerCase()}`}>{agency.isVerified ? "Doğrulanmış" : "Doğrulama bekliyor"}</span>
            </div>
            <div className="admin-stats">
              <div className="metric"><span>Tedavi paketleri</span><strong>{agency._count.packages}</strong><small>yayındaki paket</small></div>
              <div className="metric"><span>Destek hizmetleri</span><strong>{agency._count.services}</strong><small>yayındaki hizmet</small></div>
            </div>
            <div className="row business-actions">
              <Link className="primary" href={`/agency/${agency.id}`}>Profili yönet</Link>
              {agency.isVerified && <Link className="secondary" href={`/agencies/${agency.id}`}>Yayınlanan profili gör</Link>}
            </div>
          </section>
        ))}
      </div>
      {!rows.length && <div className="empty">Henüz sağlık turizmi profiliniz yok.</div>}
    </div>
  );
}
