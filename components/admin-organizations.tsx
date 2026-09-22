"use client";

import { useEffect, useState } from "react";

type Org = {
  id: string;
  name: string;
  type: string;
  status: string;
  city: string;
  district?: string | null;
  address: string;
  phone: string;
  email: string;
  licenseFileName?: string | null;
  owner?: { name?: string | null; email?: string | null } | null;
};

const TYPE_LABELS: Record<string, string> = {
  HOSPITAL: "Hastane",
  CLINIC: "Klinik",
  PHARMACY: "Eczane",
  IMAGING_CENTER: "Görüntüleme Merkezi",
  LABORATORY: "Tıbbi Laboratuvar",
};

export default function AdminOrganizations() {
  const [rows, setRows] = useState<Org[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    const response = await fetch("/api/admin/organizations");
    const text = await response.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!response.ok || !Array.isArray(data)) {
      const message = data && typeof data === "object" && "error" in data && typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Kurum listesi yüklenemedi.";
      setRows([]);
      setError(message);
      return;
    }
    setRows(data as Org[]);
  }

  useEffect(() => { load(); }, []);

  async function act(id: string, status: string) {
    const reason = (status === "REJECTED" || status === "SUSPENDED")
      ? prompt("İşlem nedeni (Opsiyonel)") || "Başvuru doğrulanamadı"
      : undefined;
    await fetch(`/api/admin/organizations/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, reason }),
    });
    load();
  }

  if (error) return <div className="form-error">{error}</div>;
  if (!rows.length) return <div className="empty">Listelenecek kurum başvurusu yok.</div>;

  return (
    <div className="slot-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {rows.map((org) => (
        <div className="organization-admin-row" style={{ border: "1px solid var(--border-light)", borderRadius: "12px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", backgroundColor: "var(--bg)" }} key={org.id}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px" }}>{org.name}</h3>
              <span className="status" style={{ fontSize: "12px", marginTop: "4px", display: "inline-block" }}>{TYPE_LABELS[org.type] || org.type}</span>
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "2px" }}>
              <span>👤 {org.owner?.name || "Sahip bilgisi yok"} ({org.owner?.email || "—"})</span>
              <span>📍 {org.city}{org.district ? `, ${org.district}` : ""} - {org.address}</span>
              <span>📞 {org.phone} | ✉️ {org.email}</span>
            </div>
            <div style={{ marginTop: "8px", fontSize: "13px" }}>
              {org.licenseFileName
                ? <a href={`/api/admin/organizations/${org.id}/file`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--primary)", fontWeight: 500, padding: "4px 8px", backgroundColor: "var(--primary-light)", borderRadius: "6px", textDecoration: "none" }}>📄 Belgeyi İncele ({org.licenseFileName})</a>
                : <span style={{ color: "var(--danger)", fontWeight: 500 }}>⚠️ Belge yüklenmemiş</span>}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
            <span className={`status org-${org.status.toLowerCase()}`}>{org.status}</span>
            <div className="row">
              {org.status === "PENDING" && (
                <>
                  <button className="secondary compact" onClick={() => act(org.id, "APPROVED")}>Onayla</button>
                  <button className="danger compact" onClick={() => act(org.id, "REJECTED")}>Reddet</button>
                </>
              )}
              {org.status === "APPROVED" && (
                <>
                  <button className="secondary compact" onClick={() => act(org.id, "SUSPENDED")}>Askıya Al</button>
                  <button className="danger compact" onClick={() => act(org.id, "REJECTED")}>İptal Et</button>
                </>
              )}
              {(org.status === "REJECTED" || org.status === "SUSPENDED") && (
                <>
                  <button className="primary compact" onClick={() => act(org.id, "APPROVED")}>Tekrar Onayla</button>
                  <button className="secondary compact" onClick={() => act(org.id, "PENDING")}>İncelemeye Al</button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
