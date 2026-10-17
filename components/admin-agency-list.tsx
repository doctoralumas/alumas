"use client";
import { useEffect, useState } from "react";
import AdminVerificationDocuments from "@/components/admin-verification-documents";
import { useTranslations } from "next-intl";

export default function AdminAgencyList() {
  const t = useTranslations("admin.agencyList");
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const load = async () => {
    const response = await fetch("/api/admin/agencies");
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
    const response = await fetch("/api/admin/agencies", {
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
      {rows.map((agency) => (
        <div className="slot-row" key={agency.id} style={{ alignItems: "flex-start" }}>
          <div>
            <b>{agency.name}</b>
            <span>
              {agency.city} · {agency.owner?.name || t("defaultOwner")} · {agency.owner?.email || agency.email}
            </span>
            <AdminVerificationDocuments documents={agency.verificationDocuments || []} onChanged={load} />
          </div>
          <div className="row">
            <span className="status">{agency.status}</span>
            {agency.status !== "APPROVED" ? (
              <button className="primary" onClick={() => set(agency.id, true)}>
                {t("approve")}
              </button>
            ) : (
              <button className="secondary" onClick={() => set(agency.id, false)}>
                {t("suspend")}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
