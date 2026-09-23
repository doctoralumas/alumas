"use client";

import { useEffect, useState } from "react";

type Visit = {
  id: string;
  patientName: string;
  title: string;
  detail: string;
  city: string;
  district?: string | null;
  addressNote?: string | null;
  preferredAt?: string | null;
  note?: string | null;
  status: string;
  statusLabel: string;
};

export default function HomeVisitQueue({ organizationId }: { organizationId: string }) {
  const [rows, setRows] = useState<Visit[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    const response = await fetch(`/api/organizations/${organizationId}/home-visits`);
    setRows(response.ok ? await response.json() : []);
  }

  useEffect(() => { load(); }, [organizationId]);

  async function update(requestId: string, status: string) {
    const response = await fetch(`/api/organizations/${organizationId}/home-visits`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requestId, status }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMsg(data.error || "Talep güncellenemedi"); return; }
    setMsg(data.statusLabel || "Talep güncellendi");
    load();
  }

  return (
    <section className="panel form-span">
      <h2>Evde hizmet talepleri</h2>
      <p>Hasta, yayındaki evde hizmetinizi seçerek talep bırakır. Kabul edene kadar randevu kesinleşmez.</p>
      {msg && <div className="inline-message">{msg}</div>}
      <div className="slot-list">
        {rows.map((row) => (
          <div className="slot-row" key={row.id}>
            <div>
              <b>{row.patientName} · {row.title}</b>
              <span>{[row.detail, row.district, row.addressNote, row.preferredAt ? new Date(row.preferredAt).toLocaleString("tr-TR") : "", row.note].filter(Boolean).join(" · ")}</span>
            </div>
            <div className="row">
              <span className="status">{row.statusLabel}</span>
              {row.status === "REQUESTED" && (
                <>
                  <button type="button" className="primary" onClick={() => update(row.id, "ACCEPTED")}>Kabul et</button>
                  <button type="button" className="secondary" onClick={() => update(row.id, "DECLINED")}>Reddet</button>
                </>
              )}
              {row.status === "ACCEPTED" && <button type="button" className="secondary" onClick={() => update(row.id, "COMPLETED")}>Tamamlandı</button>}
            </div>
          </div>
        ))}
        {!rows.length && <div className="empty">Bekleyen evde hizmet talebi yok.</div>}
      </div>
    </section>
  );
}
