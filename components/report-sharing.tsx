"use client";
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

export default function ReportSharing({ fromDate, toDate }: { fromDate: string; toDate: string }) {
  const t = useTranslations("health.reportSharing");
  const locale = useLocale();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => {
    fetch("/api/health-sharing/doctors").then((r) => (r.ok ? r.json() : [])).then(setDoctors);
    fetch("/api/health/report-shares").then((r) => (r.ok ? r.json() : [])).then(setShares);
  };

  useEffect(() => {
    load();
  }, []);

  async function share() {
    if (!doctorId) return;
    const r = await fetch("/api/health/report-shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId, fromDate, toDate }),
    });
    const j = await r.json().catch(() => ({}));
    setMsg(r.ok ? t("shareSuccess") : j.error || t("shareFailed"));
    if (r.ok) load();
  }

  async function revoke(id: string) {
    await fetch(`/api/health/report-shares?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    load();
  }

  return (
    <section className="panel health-section">
      <h2>{t("title")}</h2>
      <p>{t("subtitle")}</p>
      <div className="row gap report-share-v16">
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          <option value="">{t("selectDoctor")}</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} · {d.specialty}
            </option>
          ))}
        </select>
        <button className="primary" onClick={share}>
          {t("share")}
        </button>
      </div>
      {msg && <p className="form-message">{msg}</p>}
      <div className="tracker-list-v14">
        {shares.map((s) => (
          <div className="tracker-row-v14" key={s.id}>
            <div>
              <b>{s.doctor.name}</b>
              <span>
                {new Date(s.fromDate).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US")} -{" "}
                {new Date(s.toDate).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US")}
              </span>
            </div>
            <button className="secondary compact" onClick={() => revoke(s.id)}>
              {t("revoke")}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
