"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function HealthSummarySharing() {
  const t = useTranslations("health.healthSummarySharing");

  const sections = [
    { key: "allergies", label: t("secAllergies") },
    { key: "conditions", label: t("secConditions") },
    { key: "medications", label: t("secMedications") },
    { key: "vaccinations", label: t("secVaccinations") },
    { key: "procedures", label: t("secProcedures") },
    { key: "measurements", label: t("secMeasurements") },
    { key: "profiles", label: t("secProfiles") },
  ] as const;

  const [data, setData] = useState<any>({ shares: [], doctors: [] });
  const [profiles, setProfiles] = useState<any[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [selected, setSelected] = useState<string[]>([
    "allergies",
    "conditions",
    "medications",
    "vaccinations",
  ]);
  const [profileIds, setProfileIds] = useState<string[]>([]);
  const [msg, setMsg] = useState("");

  const load = () =>
    fetch("/api/health/summary-shares")
      .then((r) => (r.ok ? r.json() : { shares: [], doctors: [] }))
      .then(setData);

  useEffect(() => {
    load();
    fetch("/api/health/special-profiles")
      .then((r) => (r.ok ? r.json() : []))
      .then(setProfiles);
  }, []);

  function toggle(s: string) {
    setSelected((v) => (v.includes(s) ? v.filter((x) => x !== s) : [...v, s]));
  }

  async function share() {
    const r = await fetch("/api/health/summary-shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId,
        sections: selected,
        profileIds: selected.includes("profiles") ? profileIds : [],
      }),
    });
    const j = await r.json().catch(() => ({}));
    setMsg(r.ok ? t("shareSuccess") : j.error || t("shareFailed"));
    if (r.ok) load();
  }

  async function revoke(id: string) {
    await fetch("/api/health/summary-shares?id=" + encodeURIComponent(id), {
      method: "DELETE",
    });
    load();
  }

  return (
    <section className="panel health-section">
      <h2>{t("title")}</h2>
      <p>{t("subtitle")}</p>
      <div className="inline-form">
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          <option value="">{t("selectDoctor")}</option>
          {data.doctors.map((d: any) => (
            <option key={d.id} value={d.id}>
              {d.name} · {d.specialty}
            </option>
          ))}
        </select>
        <button className="primary" disabled={!doctorId || !selected.length} onClick={share}>
          {t("share")}
        </button>
      </div>
      <div className="scope-grid-v21">
        {sections.map(({ key, label }) => (
          <label
            key={key}
            className={selected.includes(key) ? "scope-chip-v21 active" : "scope-chip-v21"}
          >
            <input type="checkbox" checked={selected.includes(key)} onChange={() => toggle(key)} />
            {label}
          </label>
        ))}
      </div>
      {selected.includes("profiles") && (
        <div>
          <p>
            <b>{t("familyProfilesToShare")}</b>
          </p>
          <div className="scope-grid-v21">
            {profiles.map((p: any) => (
              <label
                key={p.id}
                className={profileIds.includes(p.id) ? "scope-chip-v21 active" : "scope-chip-v21"}
              >
                <input
                  type="checkbox"
                  checked={profileIds.includes(p.id)}
                  onChange={() =>
                    setProfileIds((v) =>
                      v.includes(p.id) ? v.filter((x) => x !== p.id) : [...v, p.id]
                    )
                  }
                />
                {p.type === "CHILD" ? t("childType") : t("pregnancyType")} · {p.name}
              </label>
            ))}
          </div>
        </div>
      )}
      {msg && <div className="notice-v14">{msg}</div>}
      <div className="doc-list">
        {data.shares.map((s: any) => (
          <div className="doc-row" key={s.id}>
            <div>
              <b>{s.doctor.name}</b>
              <span>
                {s.sections.join(", ")}
                {s.profileIds?.length
                  ? ` · ${t("profileCount", { count: s.profileIds.length })}`
                  : ""}
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
