import SectionVisual from "@/components/section-visual";
import GoogleNearbyPlaces from "@/components/google-nearby-places";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Page({searchParams}:{searchParams:Promise<{category?:string}>}) {
  const user = await currentUser();
  if (!user) {
    redirect("/login?next=/nearby");
  }
  const q=await searchParams;
  return (
    <div className="page" style={{ maxWidth: "1200px" }}>
      <SectionVisual slug="nearby" alt="Küresel Keşif Haritası" />
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="kicker">GOOGLE PLACES ENTEGRASYONU</span>
          <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "8px 0" }}>Küresel Keşif Haritası</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "16px", maxWidth: "600px" }}>
            Dünyanın neresinde olursanız olun; cihaz konumunuzu kullanarak size en yakın hastane, nöbetçi eczane veya acil servisleri Google Haritalar altyapısıyla anında bulun.
          </p>
        </div>
      </div>

      <div style={{ padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "18px" }}>💡</span>
        <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>
          <strong>Randevu mu almak istiyorsunuz?</strong> Sadece Alumas üzerinden randevu alınabilen anlaşmalı kurumları görmek ve hasta yorumlarını okumak için <Link href="/organizations" style={{ color: "#0f172a", fontWeight: 600, textDecoration: "underline" }}>Alumas Sağlık Ağı</Link> sayfamıza göz atın.
        </p>
      </div>

      <GoogleNearbyPlaces initial={q?.category} isLoggedIn={!!user} />
    </div>
  );
}
