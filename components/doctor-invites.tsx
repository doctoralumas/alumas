"use client";

import { useState } from "react";
import { Check, X, EnvelopeSimpleOpen } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";

export default function DoctorInvites({ invites: initialInvites }: { invites: any[] }) {
  const t = useTranslations("professional.doctorInvites");
  const [invites, setInvites] = useState(initialInvites);
  const [loading, setLoading] = useState<string | null>(null);

  if (invites.length === 0) return null;

  async function handleInvite(id: string, action: "ACCEPT" | "DECLINE") {
    setLoading(id);
    const r = await fetch(`/api/organization-invites/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    
    if (r.ok) {
      setInvites(invites.filter((inv) => inv.id !== id));
      if (action === "ACCEPT") {
        window.location.reload();
      }
    } else {
      const data = await r.json().catch(() => ({}));
      alert(data.error || t("error"));
      setLoading(null);
    }
  }

  return (
    <div style={{ marginBottom: "32px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {invites.map((inv) => (
        <div key={inv.id} style={{
          background: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 6px -1px rgba(14, 165, 233, 0.1)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#0ea5e9", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <EnvelopeSimpleOpen size={28} weight="duotone" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#0c4a6e", fontWeight: 700 }}>
                {t("inviteTitle", { name: inv.organization.name })}
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#0369a1" }}>
                {t("inviteDesc")}
              </p>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "12px" }}>
            <button 
              onClick={() => handleInvite(inv.id, "DECLINE")}
              disabled={loading === inv.id}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "10px 16px", borderRadius: "100px", border: "1px solid #cbd5e1",
                background: "white", color: "#64748b", fontWeight: 600, fontSize: "14px",
                cursor: loading === inv.id ? "not-allowed" : "pointer"
              }}
            >
              <X size={16} weight="bold" /> {t("decline")}
            </button>
            <button 
              onClick={() => handleInvite(inv.id, "ACCEPT")}
              disabled={loading === inv.id}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "10px 16px", borderRadius: "100px", border: "none",
                background: "#0ea5e9", color: "white", fontWeight: 600, fontSize: "14px",
                cursor: loading === inv.id ? "not-allowed" : "pointer",
                boxShadow: "0 2px 4px rgba(14, 165, 233, 0.3)"
              }}
            >
              <Check size={16} weight="bold" /> {t("accept")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
