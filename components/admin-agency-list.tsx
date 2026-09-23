"use client";
import { useEffect, useState } from "react";
import AdminVerificationDocuments from "@/components/admin-verification-documents";

export default function AdminAgencyList() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const load = async () => {
    const response = await fetch("/api/admin/agencies");
    const data = await response.json();
    if (!Array.isArray(data)) { setError(data.error || "Acenteler yüklenemedi."); setRows([]); return; }
    setError("");
    setRows(data);
  };
  useEffect(() => { load(); }, []);
  async function set(id: string, approved: boolean) {
    const response = await fetch("/api/admin/agencies", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, approved }) });
    const data = await response.json().catch(() => ({}));
    await load();
    if (!response.ok) setError(data.error || "Acente durumu güncellenemedi.");
  }
  return (
    <div className="slot-list">
      {error && <div className="form-error">{error}</div>}
      {rows.map((agency) => (
        <div className="slot-row" key={agency.id} style={{ alignItems: "flex-start" }}>
          <div>
            <b>{agency.name}</b>
            <span>{agency.city} · {agency.owner?.name || "Sistem"} · {agency.owner?.email || agency.email}</span>
            <AdminVerificationDocuments documents={agency.verificationDocuments || []} onChanged={load} />
          </div>
          <div className="row">
            <span className="status">{agency.status}</span>
            {agency.status !== "APPROVED"
              ? <button className="primary" onClick={() => set(agency.id, true)}>Onayla</button>
              : <button className="secondary" onClick={() => set(agency.id, false)}>Askıya al</button>}
          </div>
        </div>
      ))}
    </div>
  );
}
