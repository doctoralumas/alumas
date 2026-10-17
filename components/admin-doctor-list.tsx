"use client";
import { useEffect, useState } from "react";
import AdminVerificationDocuments from "@/components/admin-verification-documents";
import { useTranslations } from "next-intl";

export default function AdminDoctorList() {
  const t = useTranslations("admin.doctorList");
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const load = async () => {
    const response = await fetch("/api/admin/doctors");
    const data = await response.json();
    if (!Array.isArray(data)) {
      setError(data.error || t("loadError"));
      setRows([]);
      return;
    }
    setError("");
    setRows(data);
  };
  useEffect(() => {
    load();
  }, []);
  async function set(id: string, approved: boolean) {
    const response = await fetch("/api/admin/doctors", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, approved }),
    });
    const data = await response.json().catch(() => ({}));
    await load();
    if (!response.ok) setError(data.error || t("updateError"));
  }
  return (
    <div className="slot-list">
      {error && <div className="form-error">{error}</div>}
      {rows.map((doctor) => (
        <div className="slot-row" key={doctor.id} style={{ alignItems: "flex-start" }}>
          <div>
            <b>{doctor.name}</b>
            <span>
              {doctor.specialty} · {doctor.city} · {doctor.user?.email}
            </span>
            <small>{doctor.licenseNumber ? t("licensePrefix", { num: doctor.licenseNumber }) : "—"}</small>
            <AdminVerificationDocuments documents={doctor.verificationDocuments || []} onChanged={load} />
          </div>
          <div className="row">
            <span className="status">{doctor.isVerified ? t("statusVerified") : t("statusPending")}</span>
            {doctor.isVerified ? (
              <button className="secondary" onClick={() => set(doctor.id, false)}>
                {t("unpublish")}
              </button>
            ) : (
              <button className="primary" onClick={() => set(doctor.id, true)}>
                {t("approve")}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
