"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Share = { doctorId: string; status: string; scopes: string[]; doctor: { name: string } };
type Doc = { id: string; name: string; specialty: string };

const SCOPE_KEYS = ["measurements", "labs", "documents", "imaging", "care_plans"] as const;

export default function HealthSharing() {
  const t = useTranslations("healthSharing");
  const [shares, setShares] = useState<Share[]>([]);
  const [doctors, setDoctors] = useState<Doc[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [scopes, setScopes] = useState<string[]>(["measurements", "labs"]);

  const load = () => {
    fetch("/api/health-sharing").then((r) => (r.ok ? r.json() : [])).then(setShares);
    fetch("/api/health-sharing/doctors").then((r) => (r.ok ? r.json() : [])).then(setDoctors);
  };

  useEffect(() => {
    load();
  }, []);

  function toggle(x: string) {
    setScopes((v) => (v.includes(x) ? v.filter((s) => s !== x) : [...v, x]));
  }

  async function grant() {
    if (!doctorId || !scopes.length) return;
    await fetch("/api/health-sharing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId, scopes }),
    });
    load();
  }

  async function revoke(docId: string) {
    await fetch("/api/health-sharing", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId: docId }),
    });
    load();
  }

  return (
    <section className="panel health-section">
      <h2>{t("title")}</h2>
      <p>{t("description")}</p>
      {doctors.length > 0 && (
        <div className="share-grant">
          <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
            <option value="">{t("selectDoctor")}</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} · {d.specialty}
              </option>
            ))}
          </select>
          <div className="scope-grid">
            {SCOPE_KEYS.map((k) => (
              <label className="scope-chip" key={k}>
                <input type="checkbox" checked={scopes.includes(k)} onChange={() => toggle(k)} />
                {t(`scopes.${k}` as any)}
              </label>
            ))}
          </div>
          <button className="secondary" type="button" onClick={grant}>
            {t("grantAction")}
          </button>
        </div>
      )}
      {shares.map((s) => (
        <div className="share-row" key={s.doctorId}>
          <div>
            <b>{s.doctor.name}</b>
            <span>{s.scopes.map((sc) => t(`scopes.${sc}` as any) || sc).join(" · ")}</span>
          </div>
          <button className="danger" type="button" onClick={() => revoke(s.doctorId)} disabled={s.status !== "active"}>
            {s.status === "active" ? t("revokeAction") : t("revokedStatus")}
          </button>
        </div>
      ))}
      {!shares.length && <div className="empty">{t("empty")}</div>}
    </section>
  );
}