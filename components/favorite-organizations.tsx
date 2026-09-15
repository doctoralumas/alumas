"use client";
import { useEffect, useState } from "react";
import { Buildings, MapPin } from "@phosphor-icons/react";
import Link from "next/link";

export default function FavoriteOrganizations() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/organizations/favorites")
      .then((r) => (r.ok ? r.json() : []))
      .then(setRows);
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
      {rows.map((o) => {
        return (
          <Link
            href={`/organizations/${o.slug}`}
            key={o.id}
            style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "24px", textDecoration: "none", color: "inherit", transition: "all 0.2s", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 700, flexShrink: 0 }}>
                {o.name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "10px", fontWeight: 800, color: "#10b981", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px", display: "block" }}>
                  Favori Kurum
                </span>
                <strong style={{ display: "block", fontSize: "16px", color: "#0f172a", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {o.name}
                </strong>
                <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                  <MapPin size={14} weight="duotone" /> {o.city}{o.district ? ` - ${o.district}` : ""}
                </span>
              </div>
            </div>
          </Link>
        );
      })}

      {!rows.length && (
        <div style={{ padding: "32px", textAlign: "center", background: "#f8fafc", borderRadius: "24px", border: "1px dashed #cbd5e1", color: "#94a3b8", fontSize: "14px", gridColumn: "1 / -1" }}>
          Henüz favori kurumun yok.
        </div>
      )}
    </div>
  );
}
