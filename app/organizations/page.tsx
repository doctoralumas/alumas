import SectionVisual from "@/components/section-visual";
import OrganizationDirectory from "@/components/organization-directory";

export default function Organizations() {
  return (
    <div className="page" style={{ maxWidth: "1200px" }}>
      <SectionVisual slug="organizations" alt="Sağlık Kurumları" />
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="kicker">Alumas Network</span>
          <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "8px 0" }}>Sağlık Kurumları</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "16px", maxWidth: "600px" }}>
            Hastaneler, klinikler, laboratuvarlar ve eczaneler. İhtiyacınız olan sağlık kurumunu bulun ve yol tarifi alın.
          </p>
        </div>
      </div>

      <OrganizationDirectory />
    </div>
  );
}
