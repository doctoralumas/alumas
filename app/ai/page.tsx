import HealthNavigator from "@/components/ai/health-navigator";
import Link from "next/link";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AiPage(){
  const user = await currentUser();
  if (!user) {
    redirect("/login?next=/ai");
  }
  return (
    <div className="page" style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px", display: "flex", flexDirection: "column", minHeight: "calc(100vh - 80px)" }}>
      
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <HealthNavigator />
      </div>

      <div style={{ marginTop: "auto", paddingTop: "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
        <p style={{ margin: 0, fontSize: "12px", color: "#64748b", textAlign: "center", lineHeight: "1.5" }}>
          Luma bir yapay zeka asistanıdır ve tıbbi teşhis koyamaz. Acil durumlarda lütfen <Link href="/emergency" style={{ color: "#ef4444", fontWeight: 600, textDecoration: "none" }}>112'yi arayın</Link> veya en yakın sağlık kuruluşuna başvurun.
        </p>
        <div style={{ display: "flex", gap: "16px", fontSize: "13px", fontWeight: 600 }}>
          <Link href="/services" style={{ color: "#3b82f6", textDecoration: "none" }}>Tüm Hizmetler</Link>
          <span style={{ color: "#cbd5e1" }}>•</span>
          <Link href="/ai-policy" style={{ color: "#64748b", textDecoration: "none" }}>Yapay Zeka Politikası</Link>
        </div>
      </div>
      
    </div>
  );
}
