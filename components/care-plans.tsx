"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function CarePlans() {
  const t = useTranslations("carePlans");
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/care-plans")
      .then((r) => (r.ok ? r.json() : []))
      .then(setPlans);
  }, []);

  return (
    <section className="panel health-section">
      <h2>{t("title")}</h2>
      <p>{t("description")}</p>
      {plans.map((p) => (
        <article className="care-plan" key={p.id}>
          <div className="row between" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <b>{p.title}</b>
              <span>{p.doctor?.name}</span>
            </div>
            <em>{p.status === "active" ? t("activeStatus") : t("completedStatus")}</em>
          </div>
          {p.summary && <p>{p.summary}</p>}
          <div className="care-items">
            {p.items?.map((i: any) => (
              <div key={i.id}>
                <strong>{i.title}</strong>
                <span>
                  {i.instructions || "—"}
                  {i.schedule ? ` · ${i.schedule}` : ""}
                </span>
              </div>
            ))}
          </div>
        </article>
      ))}
      {!plans.length && <div className="empty">{t("empty")}</div>}
    </section>
  );
}