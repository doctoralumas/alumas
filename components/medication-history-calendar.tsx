"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

const ym = () => new Date().toISOString().slice(0, 7);

export default function MedicationHistoryCalendar() {
  const t = useTranslations("health.medicationHistoryCalendar");
  const [month, setMonth] = useState(ym());
  const [data, setData] = useState<any>({ days: {} });

  useEffect(() => {
    fetch(`/api/health/medication-history?month=${month}`)
      .then((r) => (r.ok ? r.json() : { days: {} }))
      .then(setData);
  }, [month]);

  const cells = useMemo(() => {
    const [y, m] = month.split("-").map(Number),
      first = new Date(y, m - 1, 1),
      days = new Date(y, m, 0).getDate(),
      offset = (first.getDay() + 6) % 7;
    return [
      ...Array(offset).fill(null),
      ...Array.from({ length: days }, (_, i) => i + 1),
    ];
  }, [month]);

  return (
    <section className="panel health-section">
      <div className="row between">
        <div>
          <h2>{t("title")}</h2>
          <p>{t("subtitle")}</p>
        </div>
        <input
          className="date-input-v15"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>
      <div className="med-calendar-v16">
        <div>{t("days.mon")}</div>
        <div>{t("days.tue")}</div>
        <div>{t("days.wed")}</div>
        <div>{t("days.thu")}</div>
        <div>{t("days.fri")}</div>
        <div>{t("days.sat")}</div>
        <div>{t("days.sun")}</div>
        {cells.map((d, i) => {
          if (!d) return <span key={"e" + i} />;
          const key = `${month}-${String(d).padStart(2, "0")}`,
            x = data.days?.[key];
          return (
            <article key={key} className="med-day-v16">
              <b>{d}</b>
              {x && (
                <>
                  <span className="taken">✓ {x.taken}</span>
                  <span className="skipped">× {x.skipped}</span>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
