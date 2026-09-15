"use client";
import { useEffect, useState } from "react";
import { Star, MapPin } from "@phosphor-icons/react";
import Link from "next/link";

export default function FavoriteDoctors() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/doctors/favorites")
      .then((r) => (r.ok ? r.json() : []))
      .then(setRows);
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
      {rows.map((d) => {
        const initials = d.name.split(" ").slice(-2).map((x: string) => x[0]).join("");
        return (
          <Link
            href={`/doctors/${d.slug}`}
            key={d.id}
            style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "24px", textDecoration: "none", color: "inherit", transition: "all 0.2s", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "#f1f5f9", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "16px", color: "#0f172a", marginBottom: "2px" }}>{d.name}</strong>
                <span style={{ fontSize: "13px", color: "#64748b" }}>{d.specialty}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 700, color: "#f59e0b" }}>
                <Star size={16} weight="fill" />
                {d.reviewCount > 0 ? (
                  <>{d.rating.toFixed(1)} <span style={{ color: "#94a3b8", fontWeight: 500 }}>({d.reviewCount})</span></>
                ) : (
                  <span style={{ color: "#64748b", fontWeight: 600 }}>Yeni</span>
                )}
              </div>
              {d.organization?.name && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  <MapPin size={14} weight="duotone" /> {d.organization.name}
                </div>
              )}
            </div>
          </Link>
        );
      })}

      {!rows.length && (
        <div style={{ padding: "32px", textAlign: "center", background: "#f8fafc", borderRadius: "24px", border: "1px dashed #cbd5e1", color: "#94a3b8", fontSize: "14px", gridColumn: "1 / -1" }}>
          Henüz favori doktorun yok.
        </div>
      )}
    </div>
  );
}
