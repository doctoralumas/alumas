import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Buildings, SuitcaseRolling, Stethoscope, CaretRight, Plus, CheckCircle, Clock } from "@phosphor-icons/react/dist/ssr";

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const rows = await prisma.healthTourismAgency.findMany({
    where: { ownerUserId: user.id },
    include: { _count: { select: { packages: { where: { isPublished: true } }, services: { where: { isActive: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page workspace" style={{ maxWidth: "1200px" }}>
      <div className="page-title row between" style={{ marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="kicker" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <SuitcaseRolling weight="fill" size={18} /> Alumas Turizm
          </span>
          <h1 style={{ fontSize: "28px", margin: "8px 0" }}>Sağlık turizmi hesaplarım</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Tedavi paketlerinizi ve destek hizmetlerinizi buradan yönetin.</p>
        </div>
        <Link className="primary" href="/agency/apply" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", borderRadius: "100px", fontWeight: 600 }}>
          <Plus size={20} weight="bold" /> Yeni Profil Oluştur
        </Link>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "24px" }}>
        {rows.map((agency) => (
          <section key={agency.id} style={{ background: "#fff", borderRadius: "24px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "#f0f9ff", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Buildings size={24} weight="duotone" />
                </div>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "#0f172a" }}>{agency.name}</h2>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
                    {agency.city}
                  </p>
                </div>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 700, background: agency.isVerified ? "#ecfdf5" : "#fffbeb", color: agency.isVerified ? "#10b981" : "#d97706" }}>
                {agency.isVerified ? <CheckCircle size={16} weight="fill" /> : <Clock size={16} weight="fill" />}
                {agency.isVerified ? "Doğrulandı" : "Bekliyor"}
              </span>
            </div>
            
            <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "#f8fafc" }}>
              <div style={{ background: "#fff", padding: "16px", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ color: "#64748b", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                  <Stethoscope size={16} weight="duotone" /> Tedavi Paketleri
                </span>
                <strong style={{ fontSize: "28px", color: "#0f172a", lineHeight: 1 }}>{agency._count.packages}</strong>
                <span style={{ color: "#94a3b8", fontSize: "12px" }}>Yayındaki paket</span>
              </div>
              <div style={{ background: "#fff", padding: "16px", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ color: "#64748b", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                  <SuitcaseRolling size={16} weight="duotone" /> Destek Hizmetleri
                </span>
                <strong style={{ fontSize: "28px", color: "#0f172a", lineHeight: 1 }}>{agency._count.services}</strong>
                <span style={{ color: "#94a3b8", fontSize: "12px" }}>Yayındaki hizmet</span>
              </div>
            </div>
            
            <div style={{ padding: "24px", display: "flex", gap: "12px", flexWrap: "wrap", borderTop: "1px solid #e2e8f0" }}>
              <Link href={/agency/} style={{ flex: 1, padding: "12px", background: "#0f172a", color: "#fff", borderRadius: "12px", textDecoration: "none", fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "0.2s" }}>
                Profili Yönet <CaretRight size={16} weight="bold" />
              </Link>
              {agency.isVerified && (
                <Link href={/agencies/} style={{ flex: 1, padding: "12px", background: "#f1f5f9", color: "#475569", borderRadius: "12px", textDecoration: "none", fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s", border: "1px solid #cbd5e1" }}>
                  Yayınlanan Profili Gör
                </Link>
              )}
            </div>
          </section>
        ))}
      </div>
      {!rows.length && (
        <div style={{ padding: "64px 24px", textAlign: "center", background: "#f8fafc", borderRadius: "24px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
          Henüz sağlık turizmi profiliniz yok.
        </div>
      )}
    </div>
  );
}
