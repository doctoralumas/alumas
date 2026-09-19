import SectionVisual from "@/components/section-visual";
import OrganizationDirectory from '@/components/organization-directory';
import { currentUser } from '@/lib/auth';
import Link from 'next/link';

export default async function Organizations() {
  const user = await currentUser();
  return (
    <div className="page" style={{ maxWidth: "1200px" }}>
      <SectionVisual slug="organizations" alt="Alumas Sağlık Ağı" />
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="kicker">ALUMAS NETWORK</span>
          <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "8px 0" }}>Alumas Sağlık Ağı</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "16px", maxWidth: "600px" }}>
            Alumas'a kayıtlı onaylı hastane ve klinikleri inceleyin, uzman doktorlarımızdan anında randevu alın ve kullanıcı değerlendirmelerini okuyun.
          </p>
        </div>
      </div>

      <div style={{ padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "18px" }}>🌍</span>
        <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>
          <strong>Bulunduğunuz bölgede sonuç bulamadınız mı?</strong> Dünyadaki tüm sağlık kurumlarını (Google Haritalar üzerinden) görmek için <Link href="/nearby" style={{ color: "#0f172a", fontWeight: 600, textDecoration: "underline" }}>Küresel Keşif Haritası'nı</Link> kullanın.
        </p>
      </div>

      <OrganizationDirectory isLoggedIn={!!user} />
    </div>
  );
}
