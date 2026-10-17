"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function PharmacySearch() {
  const t = useTranslations("discovery");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  async function search() {
    if (q.trim().length < 2) return;
    setRows(
      await fetch(`/api/pharmacy/search?q=${encodeURIComponent(q)}`).then(
        (r) => (r.ok ? r.json() : [])
      )
    );
    setSearched(true);
  }

  const getStockLabel = (status: string) => {
    switch (status) {
      case "in_stock":
        return t("stockInStock");
      case "limited":
        return t("stockLimited");
      default:
        return t("stockOut");
    }
  };

  return (
    <section className="panel pharmacy-search">
      <span className="kicker">{t("pharmacySearchKicker")}</span>
      <h2>{t("pharmacySearchTitle")}</h2>
      <p>{t("pharmacySearchSubtitle")}</p>

      <div className="directory-tools">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") search();
          }}
          placeholder={t("pharmacyPlaceholder")}
        />
        <button className="primary" onClick={search}>
          {t("searchButton")}
        </button>
      </div>

      {rows.map((r) => (
        <a
          className="stock-result"
          key={r.id}
          href={`/organizations/${r.organization.slug}`}
        >
          <div>
            <b>{r.itemName}</b>
            <span>
              {r.organization.name} · {r.organization.district || r.organization.city}
            </span>
          </div>
          <span className={`stock-${r.stockStatus}`}>
            {getStockLabel(r.stockStatus)}
          </span>
        </a>
      ))}

      {searched && rows.length === 0 && (
        <div className="empty">{t("pharmacyNoResults")}</div>
      )}
    </section>
  );
}
