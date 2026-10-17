"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const today = () => new Date().toISOString().slice(0, 10);

export default function MedicationAdherence() {
  const t = useTranslations("health.medicationAdherence");
  const [data, setData] = useState<any>({ doses: [] });
  const [date, setDate] = useState(today());

  const load = () =>
    fetch(`/api/health/medication-doses?date=${date}`)
      .then((r) => (r.ok ? r.json() : { doses: [] }))
      .then(setData);

  useEffect(() => {
    load();
  }, [date]);

  async function mark(d: any, status: "TAKEN" | "SKIPPED") {
    await fetch("/api/health/medication-doses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medicationId: d.medicationId,
        scheduledFor: d.scheduledFor,
        status,
      }),
    });
    load();
  }

  return (
    <section className="panel health-section">
      <div className="row between">
        <div>
          <h2>{t("title")}</h2>
          <p>{t("subtitle")}</p>
        </div>
        <input
          className="date-input-v15"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="dose-log-list-v15">
        {data.doses?.length ? (
          data.doses.map((d: any) => (
            <div
              className="dose-log-row-v15"
              key={`${d.medicationId}-${d.time}`}
            >
              <div>
                <strong>{d.time}</strong>
                <span>
                  <b>{d.name}</b> · {d.dose}
                </span>
              </div>
              <div className="row gap">
                {d.log ? (
                  <span
                    className={`dose-status-v15 ${d.log.status.toLowerCase()}`}
                  >
                    {d.log.status === "TAKEN" ? t("taken") : t("skipped")}
                  </span>
                ) : (
                  <>
                    <button
                      className="secondary compact"
                      onClick={() => mark(d, "SKIPPED")}
                    >
                      {t("skipped")}
                    </button>
                    <button
                      className="primary compact"
                      onClick={() => mark(d, "TAKEN")}
                    >
                      {t("taken")}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>{t("noDoses")}</p>
        )}
      </div>
    </section>
  );
}
