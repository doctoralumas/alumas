"use client";
import { useEffect, useState } from "react";
import AdminVerificationDocuments from "@/components/admin-verification-documents";

export default function AdminDoctorList() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const load = async () => {
    const response = await fetch("/api/admin/doctors");
    const data = await response.json();
    if (!Array.isArray(data)) { setError(data.error || "Uzmanlar yüklenemedi."); setRows([]); return; }
    setError("");
    setRows(data);
  };
  useEffect(() => { load(); }, []);
  async function set(id: string, approved: boolean) {
    const response = await fetch("/api/admin/doctors", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, approved }) });
    const data = await response.json().catch(() => ({}));
    await load();
    if (!response.ok) setError(data.error || "Uzman durumu güncellenemedi.");
  }
  return (
    <div className="slot-list">
      {error && <div className="form-error">{error}</div>}
      {rows.map((doctor) => (
        <div className="slot-row" key={doctor.id} style={{ alignItems: "flex-start" }}>
          <div>
            <b>{doctor.name}</b>
            <span>{doctor.specialty} · {doctor.city} · {doctor.user?.email}</span>
            <small>Sicil: {doctor.licenseNumber || "—"}</small>
            <AdminVerificationDocuments documents={doctor.verificationDocuments || []} onChanged={load} />
          </div>
          <div className="row">
            <span className="status">{doctor.isVerified ? "DOĞRULANDI" : "BEKLİYOR"}</span>
            {doctor.isVerified
              ? <button className="secondary" onClick={() => set(doctor.id, false)}>Yayından kaldır</button>
              : <button className="primary" onClick={() => set(doctor.id, true)}>Onayla</button>}
          </div>
        </div>
      ))}
    </div>
  );
}
