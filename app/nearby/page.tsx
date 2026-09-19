import SectionVisual from "@/components/section-visual";
import GoogleNearbyPlaces from "@/components/google-nearby-places";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Page({searchParams}:{searchParams:Promise<{category?:string}>}) {
  const user = await currentUser();
  if (!user) {
    redirect("/login?next=/nearby");
  }
  const q=await searchParams;
  return (
    <div className="page" style={{ maxWidth: "1200px" }}>
      <SectionVisual slug="nearby" alt="Yakınımdakiler" />
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="kicker">Google Places + Alumas</span>
          <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "8px 0" }}>Yakınımdaki Kurumlar</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "16px", maxWidth: "600px" }}>
            Cihaz konumunuzu kullanarak çevrenizdeki hastaneleri, eczaneleri ve acil sağlık merkezlerini anında keşfedin.
          </p>
        </div>
      </div>

      <GoogleNearbyPlaces initial={q.category || 'health'} isLoggedIn={!!user} />
    </div>
  );
}