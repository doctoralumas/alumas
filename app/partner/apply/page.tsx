import { ShieldCheck } from "lucide-react";

export default function PartnerApplyPage() {
  return (
    <div className="page" style={{ padding: "4rem 1rem", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <ShieldCheck size={48} style={{ color: "var(--brand)", margin: "0 auto 1rem" }} />
        <h1>Çözüm Ortağı / TPA Başvurusu</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Alumas ağına aracı kurum olarak katılmak için bilgilerinizi tamamlayın.
        </p>
      </div>
      <div className="card" style={{ padding: "2rem" }}>
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "2rem" }}>
          Bu form yakında aktifleştirilecektir. Kurumsal onayınız manuel olarak yapılandırılmaktadır.
        </p>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <a href="/profile" className="button primary">Profilime Dön</a>
        </div>
      </div>
    </div>
  );
}

