"use client";

import { useCallback, useEffect, useState } from "react";
import AdminVerificationDocuments from "@/components/admin-verification-documents";

type InsurerAdminSubTab = "applications" | "catalog" | "agreements" | "audit";

export default function AdminInsuranceEcosystem() {
  const [subTab, setSubTab] = useState<InsurerAdminSubTab>("applications");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/insurance-ecosystem", { cache: "no-store" });
      if (r.ok) {
        const json = await r.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function runEcosystemAction(payload: Record<string, unknown>, okMsg: string) {
    setBusy(true);
    setFeedback(null);
    try {
      const r = await fetch("/api/admin/insurance-ecosystem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) {
        setFeedback({
          type: "err",
          text: json.message || json.error || "İşlem gerçekleştirilemedi.",
        });
        return false;
      }
      setFeedback({ type: "ok", text: okMsg });
      await loadData();
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function handleInsurerOrgStatus(org: any, status: "APPROVED" | "REJECTED" | "SUSPENDED") {
    setBusy(true);
    setFeedback(null);
    try {
      // If approving an isolated org in test mode, ensure its documents are approved first if requested
      if (status === "APPROVED" && String(org.id).startsWith("iso_")) {
        await fetch(`/api/admin/organizations/${org.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "APPROVE_ALL_DOCS" }),
        });
      }

      const r = await fetch(`/api/admin/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reason:
            status === "APPROVED"
              ? "SEDDK ve kurumsal yetki belgeleri doğrulandı"
              : "Yönetici incelemesi sonucu durum güncellendi",
        }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) {
        setFeedback({
          type: "err",
          text: json.error || "Kurum durumu güncellenemedi.",
        });
        return;
      }
      setFeedback({
        type: "ok",
        text:
          status === "APPROVED"
            ? `${org.name} kurumsal sigorta başvurusu onaylandı ve kanonik sigorta kataloğu ile eşleştirildi.`
            : `${org.name} durumu ${status} olarak güncellendi.`,
      });
      await loadData();
    } finally {
      setBusy(false);
    }
  }

  const stats = data?.stats || {
    totalInsurers: 0,
    verifiedInsurerOrgs: 0,
    pendingApplications: 0,
    totalAgreements: 0,
    confirmedAgreements: 0,
    disputedAgreements: 0,
  };
  const insurers: any[] = data?.insurers || [];
  const agreements: any[] = data?.agreements || [];
  const insurerOrgs: any[] = data?.insurerOrganizations || [];
  const auditLogs: any[] = data?.auditLogs || [];

  return (
    <div data-testid="admin-insurance-ecosystem" style={{ display: "grid", gap: "20px" }}>
      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
          gap: "12px",
        }}
      >
        <div
          style={{
            padding: "16px",
            borderRadius: "14px",
            background: "#f0fdfa",
            border: "1px solid #99f6e4",
          }}
        >
          <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#0f766e" }}>
            KATALOG SİGORTA KURUMU
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
            {stats.totalInsurers}
          </div>
        </div>

        <div
          style={{
            padding: "16px",
            borderRadius: "14px",
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
          }}
        >
          <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#047857" }}>
            DOĞRULANMIŞ KURUMSAL HESAP
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#065f46", marginTop: "4px" }}>
            {stats.verifiedInsurerOrgs}
          </div>
        </div>

        <div
          style={{
            padding: "16px",
            borderRadius: "14px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
          }}
        >
          <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#b45309" }}>
            BEKLEYEN SİGORTA BAŞVURUSU
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#92400e", marginTop: "4px" }}>
            {stats.pendingApplications}
          </div>
        </div>

        <div
          style={{
            padding: "16px",
            borderRadius: "14px",
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
          }}
        >
          <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#334155" }}>
            ANLAŞMA & UYUŞMAZLIK
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
            {stats.totalAgreements}{" "}
            <span style={{ fontSize: "13px", color: "#dc2626" }}>
              ({stats.disputedAgreements} uyuşmazlık)
            </span>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          data-testid="admin-insurance-feedback"
          style={{
            padding: "12px 16px",
            borderRadius: "12px",
            background: feedback.type === "ok" ? "#dcfce7" : "#fee2e2",
            color: feedback.type === "ok" ? "#166534" : "#991b1b",
            fontWeight: 700,
            fontSize: "13.5px",
          }}
        >
          {feedback.text}
        </div>
      )}

      {/* Sub-navigation */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {(
          [
            ["applications", `Sigorta Şirketi Başvuruları (${insurerOrgs.length})`],
            ["catalog", `Sigorta Kataloğu, Ürün & Ağlar (${insurers.length})`],
            ["agreements", `Anlaşma Doğrulama & Uyuşmazlıklar (${agreements.length})`],
            ["audit", `Denetim Kayıtları (${auditLogs.length})`],
          ] as [InsurerAdminSubTab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            data-testid={`admin-ins-subtab-${key}`}
            onClick={() => setSubTab(key)}
            style={{
              padding: "9px 14px",
              borderRadius: "10px",
              border: subTab === key ? "1px solid #0f172a" : "1px solid #cbd5e1",
              background: subTab === key ? "#0f172a" : "#ffffff",
              color: subTab === key ? "#ffffff" : "#334155",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <div style={{ padding: "24px", color: "#64748b" }}>Yükleniyor...</div>}

      {/* SUBTAB 1: APPLICATIONS */}
      {!loading && subTab === "applications" && (
        <div style={{ display: "grid", gap: "14px" }}>
          {insurerOrgs.length === 0 ? (
            <div
              style={{
                padding: "28px",
                borderRadius: "16px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              Henüz kurumsal sigorta şirketi başvurusu veya sahiplenme talebi bulunmuyor. Katalogdaki 7 gerçek sigorta şirketi kurumsal hesap sahiplenilene kadar &quot;Katalog Kaydı&quot; statüsünde listelenir.
            </div>
          ) : (
            insurerOrgs.map((org) => (
              <div
                key={org.id}
                data-testid={`admin-insurer-org-card-${org.id}`}
                style={{
                  padding: "20px",
                  borderRadius: "16px",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  display: "grid",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ fontSize: "17px", color: "#0f172a" }}>{org.name}</strong>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 800,
                          background:
                            org.status === "APPROVED"
                              ? "#dcfce7"
                              : org.status === "PENDING"
                              ? "#fef3c7"
                              : "#fee2e2",
                          color: "#0f172a",
                        }}
                      >
                        {org.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>
                      {org.legalName || org.name} · SEDDK: {org.seddkLicenseRef || "—"} ·{" "}
                      {org.city} · {org.email}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {org.status !== "APPROVED" && (
                      <button
                        type="button"
                        data-testid={`admin-approve-insurer-org-${org.id}`}
                        disabled={busy}
                        onClick={() => void handleInsurerOrgStatus(org, "APPROVED")}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "10px",
                          border: "none",
                          background: "#059669",
                          color: "#ffffff",
                          fontWeight: 700,
                          fontSize: "12.5px",
                          cursor: "pointer",
                        }}
                      >
                        ✓ Belgeleri Doğrula & Kurumu Onayla
                      </button>
                    )}
                    {org.status !== "REJECTED" && (
                      <button
                        type="button"
                        data-testid={`admin-reject-insurer-org-${org.id}`}
                        disabled={busy}
                        onClick={() => void handleInsurerOrgStatus(org, "REJECTED")}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "10px",
                          border: "1px solid #fecaca",
                          background: "#fef2f2",
                          color: "#b91c1c",
                          fontWeight: 700,
                          fontSize: "12.5px",
                          cursor: "pointer",
                        }}
                      >
                        Reddet
                      </button>
                    )}
                  </div>
                </div>

                {!String(org.id).startsWith("iso_") && org.verificationDocuments?.length > 0 && (
                  <AdminVerificationDocuments
                    documents={org.verificationDocuments}
                    onChanged={() => void loadData()}
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* SUBTAB 2: CATALOG INSURERS */}
      {!loading && subTab === "catalog" && (
        <div style={{ display: "grid", gap: "14px" }}>
          {insurers.map((ins) => (
            <div
              key={ins.id}
              data-testid={`admin-catalog-insurer-${ins.slug}`}
              style={{
                padding: "18px",
                borderRadius: "16px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "14px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <strong style={{ fontSize: "16px", color: "#0f172a" }}>{ins.name}</strong>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      background: ins.isVerifiedOrganization ? "#dcfce7" : "#f1f5f9",
                      color: ins.isVerifiedOrganization ? "#166534" : "#475569",
                    }}
                  >
                    {ins.isVerifiedOrganization
                      ? "Doğrulanmış Kurumsal Hesap"
                      : ins.slug === "alumas-demo-sigorta"
                      ? "DEMO_INTERNAL (Gizli)"
                      : "Katalog Kaydı"}
                  </span>
                </div>
                <div style={{ fontSize: "12.5px", color: "#475569", marginTop: "4px" }}>
                  {ins.legalName || ins.slug} · SEDDK: {ins.seddkLicenseRef || "—"} · Ürün:{" "}
                  {ins.products?.length || 0} · Ağ: {ins.networks?.length || 0} · Teyitli Anlaşma:{" "}
                  {ins.confirmedAgreementCount || 0}
                </div>
              </div>

              {ins.slug !== "alumas-demo-sigorta" && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void runEcosystemAction(
                        {
                          action: "UPDATE_INSURER",
                          insurerId: ins.id,
                          isPubliclyListed: !ins.isPubliclyListed,
                        },
                        "Sigorta kurumu yayın durumu güncellendi."
                      )
                    }
                    style={{
                      padding: "7px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {ins.isPubliclyListed ? "Dizinden Gizle" : "Dizinde Yayınla"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 3: AGREEMENTS & DISPUTES */}
      {!loading && subTab === "agreements" && (
        <div style={{ display: "grid", gap: "12px" }}>
          {agreements.map((agr) => (
            <div
              key={agr.id}
              data-testid={`admin-agreement-row-${agr.id}`}
              style={{
                padding: "16px",
                borderRadius: "14px",
                background:
                  agr.verificationStatus === "DISPUTED" ? "#fef2f2" : "#ffffff",
                border:
                  agr.verificationStatus === "DISPUTED"
                    ? "1px solid #fecaca"
                    : "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <strong>
                    {agr.insurerName} ↔ {agr.facilityName}
                  </strong>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      background: "#f1f5f9",
                    }}
                  >
                    {agr.verificationStatus}
                  </span>
                </div>
                <div style={{ fontSize: "12.5px", color: "#475569", marginTop: "4px" }}>
                  {agr.facilityCity} · Ürün: {agr.productType || "Tümü"} · Kapsam:{" "}
                  {agr.coverageScope}
                  {agr.disputeReason ? ` · Uyuşmazlık: ${agr.disputeReason}` : ""}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {agr.verificationStatus !== "ADMIN_VERIFIED" && (
                  <button
                    type="button"
                    data-testid={`admin-verify-agreement-${agr.id}`}
                    disabled={busy}
                    onClick={() =>
                      void runEcosystemAction(
                        { action: "VERIFY_AGREEMENT", agreementId: agr.id },
                        "Anlaşma yönetici tarafından doğrulandı (ADMIN_VERIFIED)."
                      )
                    }
                    style={{
                      padding: "7px 12px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#059669",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ✓ Yönetici Onayı Ver
                  </button>
                )}

                {agr.verificationStatus !== "EXPIRED" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void runEcosystemAction(
                        { action: "EXPIRE_AGREEMENT", agreementId: agr.id },
                        "Anlaşma süresi sonlandırıldı."
                      )
                    }
                    style={{
                      padding: "7px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Süreyi Sonlandır
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 4: AUDIT LOGS */}
      {!loading && subTab === "audit" && (
        <div style={{ display: "grid", gap: "8px" }}>
          {auditLogs.map((log) => (
            <div
              key={log.id}
              style={{
                padding: "12px",
                borderRadius: "10px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                fontSize: "12.5px",
              }}
            >
              <strong>{log.action}</strong> ({log.entityType} #{log.entityId || "—"}) ·{" "}
              {new Date(log.createdAt).toLocaleString("tr-TR")}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
