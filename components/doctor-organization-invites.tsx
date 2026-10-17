"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function DoctorOrganizationInvites() {
  const t = useTranslations("professional.doctorOrganizationInvites");
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    const r = await fetch("/api/organization-invites");
    if (r.ok) setRows(await r.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, action: string) {
    const r = await fetch(`/api/organization-invites/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const j = await r.json();
    setMsg(
      r.ok
        ? action === "ACCEPT"
          ? t("acceptedMsg")
          : t("declinedMsg")
        : j.error
    );
    if (r.ok) load();
  }

  if (rows.length === 0) return null;

  return (
    <section className="panel">
      <h2>{t("title")}</h2>
      <p>{t("desc")}</p>
      {msg && <div className="inline-message">{msg}</div>}
      <div className="slot-list">
        {rows.map((i) => (
          <div className="organization-admin-row" key={i.id}>
            <div>
              <b>{i.organization.name}</b>
              <span>
                {i.organization.type} · {i.organization.city}
              </span>
            </div>
            <div className="row">
              <button
                className="secondary compact"
                onClick={() => act(i.id, "ACCEPT")}
              >
                {t("acceptBtn")}
              </button>
              <button
                className="danger"
                onClick={() => act(i.id, "DECLINE")}
              >
                {t("declineBtn")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
