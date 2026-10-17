import AuditLogViewer from "@/components/audit-log-viewer";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export default async function Admin(){
  const u = await currentUser();
  if (!u) redirect('/login');
  if (u.role !== "ADMIN") redirect('/profile');
  const t = await getTranslations("admin");
  const [users, doctors, appointments] = await Promise.all([
    prisma.user.count(),
    prisma.doctor.count(),
    prisma.appointment.count()
  ]);
  const recent = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });

  return (
    <div className="page" style={{ paddingTop: '16px' }}>
      <div className="page-title row between">
        <div>
          <span className="kicker">{t("kicker")}</span>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>
      </div>
      <div className="admin-stats">
        <div className="metric">
          <span>{t("users")}</span>
          <strong>{users}</strong>
          <small>{t("totalAccounts")}</small>
        </div>
        <div className="metric">
          <span>{t("doctors")}</span>
          <strong>{doctors}</strong>
          <small>{t("activeProfiles")}</small>
        </div>
        <div className="metric">
          <span>{t("appointments")}</span>
          <strong>{appointments}</strong>
          <small>{t("totalRecords")}</small>
        </div>
      </div>
      <section className="panel">
        <h2>{t("recentUsers")}</h2>
        <div className="slot-list">
          {recent.map(x => (
            <div className="slot-row" key={x.id}>
              <div>
                <b>{x.name}</b>
                <span>{x.email}</span>
              </div>
              <span className="status">{x.role}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="panel health-section">
        <h2>{t("auditRecords")}</h2>
        <p>{t("auditRecordsSubtitle")}</p>
        <AuditLogViewer/>
      </section>
    </div>
  );
}
