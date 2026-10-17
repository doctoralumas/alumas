"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { homeVisitStatusLabel } from "@/lib/home-care";

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
  const t = useTranslations("professional.homeVisitQueue");
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "tr-TR";
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
    if (!response.ok) { setMsg(data.error || t("updateFailed")); return; }
    setMsg(homeVisitStatusLabel(status, false, locale) || t("updated"));
    load();
  }

  return (
    <section className="panel form-span">
      <h2>{t("title")}</h2>
      <p>{t("subtitle")}</p>
      {msg && <div className="inline-message">{msg}</div>}
      <div className="slot-list">
        {rows.map((row) => (
          <div className="slot-row" key={row.id}>
            <div>
              <b>{row.patientName} · {row.title}</b>
              <span>{[row.detail, row.district, row.addressNote, row.preferredAt ? new Date(row.preferredAt).toLocaleString(dateLocale) : "", row.note].filter(Boolean).join(" · ")}</span>
            </div>
            <div className="row">
              <span className="status">{homeVisitStatusLabel(row.status, false, locale) || row.statusLabel}</span>
              {row.status === "REQUESTED" && (
                <>
                  <button type="button" className="primary" onClick={() => update(row.id, "ACCEPTED")}>{t("acceptButton")}</button>
                  <button type="button" className="secondary" onClick={() => update(row.id, "DECLINED")}>{t("declineButton")}</button>
                </>
              )}
              {row.status === "ACCEPTED" && <button type="button" className="secondary" onClick={() => update(row.id, "COMPLETED")}>{t("completedButton")}</button>}
            </div>
          </div>
        ))}
        {!rows.length && <div className="empty">{t("empty")}</div>}
      </div>
    </section>
  );
}
