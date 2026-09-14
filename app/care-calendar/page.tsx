import CareCalendar from "@/components/care-calendar";
import SectionVisual from "@/components/section-visual";
import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";

export default function Page(){
  return (
    <div className="page">
      <SectionVisual slug="family" alt="Ortak Takvim" />
      <div style={{ marginBottom: "32px" }}>
        <Link href="/services" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#64748b", textDecoration: "none", fontSize: "14px", fontWeight: 500, marginBottom: "16px" }}>
          <CaretLeft size={16} /> Tüm Hizmetlere Dön
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="kicker">Paylaşılan Plan</span>
            <h1 style={{ fontSize: "28px", color: "#0f172a", margin: "8px 0" }}>Ortak Bakım Takvimi</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>Doktorunuzla birlikte oluşturulan tedavi ve takip görevlerini buradan yönetin.</p>
          </div>
        </div>
      </div>
      <CareCalendar />
    </div>
  )
}
