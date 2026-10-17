"use client";

import { useEffect, useState } from "react";
import HealthTrendChart from "@/components/health-trend-chart";
import { useTranslations, useLocale } from "next-intl";

export default function DoctorPatientTrends({
  patientId,
}: {
  patientId: string;
}) {
  const t = useTranslations("professional.doctorPatientTrends");
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "tr-TR";

  const [data, setData] = useState<any>(null);
  const [from, setFrom] = useState(() =>
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  );
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const load = () =>
    fetch(`/api/doctor/patients/${patientId}/trends?from=${from}&to=${to}`)
      .then(async (r) => (r.ok ? r.json() : { error: (await r.json()).error }))
      .then(setData);

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="panel health-section">
      <div className="row between">
        <div>
          <h2>{t("title")}</h2>
          <p>{t("desc")}</p>
        </div>
        <div className="row gap">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <button className="secondary compact" onClick={load}>
            {t("applyBtn")}
          </button>
        </div>
      </div>
      {data?.error ? (
        <p>{data.error}</p>
      ) : (
        data && (
          <>
            <h3>{t("bpTitle")}</h3>
            <HealthTrendChart
              labels={data.series.bp.map((x: any) =>
                new Date(x.at).toLocaleDateString(dateLocale, {
                  day: "2-digit",
                  month: "2-digit",
                })
              )}
              series={[
                {
                  name: t("systolic"),
                  values: data.series.bp.map((x: any) => x.systolic),
                },
                {
                  name: t("diastolic"),
                  values: data.series.bp.map((x: any) => x.diastolic),
                },
              ]}
            />
            <h3>{t("glucoseTitle")}</h3>
            <HealthTrendChart
              labels={data.series.glucose.map((x: any) =>
                new Date(x.at).toLocaleDateString(dateLocale, {
                  day: "2-digit",
                  month: "2-digit",
                })
              )}
              series={[
                {
                  name: "mg/dL",
                  values: data.series.glucose.map((x: any) => x.value),
                },
              ]}
            />
            <h3>{t("sleepTitle")}</h3>
            <HealthTrendChart
              labels={data.series.sleep.map((x: any) =>
                new Date(x.at).toLocaleDateString(dateLocale, {
                  day: "2-digit",
                  month: "2-digit",
                })
              )}
              series={[
                {
                  name: t("sleepHoursUnit"),
                  values: data.series.sleep.map((x: any) => x.hours),
                },
              ]}
            />
            <h3>{t("labsTitle")}</h3>
            <div className="lab-list">
              {data.labs
                ?.slice(-20)
                .reverse()
                .map((x: any) => (
                  <div className="lab-row" key={x.id}>
                    <div>
                      <b>{x.testName}</b>
                      <span>
                        {new Date(x.at).toLocaleDateString(dateLocale)}
                      </span>
                    </div>
                    <strong>
                      {x.value} {x.unit || ""}
                    </strong>
                    <span>
                      {x.referenceLow != null || x.referenceHigh != null
                        ? `${x.referenceLow ?? "—"} – ${x.referenceHigh ?? "—"}`
                        : x.reference || "—"}
                    </span>
                    <em className={`lab-${x.status}`}>{x.status}</em>
                  </div>
                ))}
            </div>
          </>
        )
      )}
    </section>
  );
}
