"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import VerificationDocumentManager from "@/components/verification-document-manager";
import type { InsuranceProductType } from "@/lib/insurance-domain";

type WorkspaceTab = "profile" | "products" | "networks" | "agreements" | "governance";

export default function InsurerWorkspaceManager({
  organization,
}: {
  organization: any;
}) {
  const [tab, setTab] = useState<WorkspaceTab>("profile");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Profile form state
  const [legalName, setLegalName] = useState("");
  const [seddkLicenseRef, setSeddkLicenseRef] = useState("");
  const [tsbMemberCode, setTsbMemberCode] = useState("");
  const [headquartersCity, setHeadquartersCity] = useState("");
  const [headquartersDistrict, setHeadquartersDistrict] = useState("");
  const [headquartersAddress, setHeadquartersAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [claimsPhone, setClaimsPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [provisionPortalUrl, setProvisionPortalUrl] = useState("");
  const [description, setDescription] = useState("");

  // Product form state
  const [prodCode, setProdCode] = useState("");
  const [prodName, setProdName] = useState("");
  const [prodType, setProdType] = useState<InsuranceProductType>("TSS");
  const [prodRequiresSgk, setProdRequiresSgk] = useState(true);

  // Network form state
  const [netCode, setNetCode] = useState("");
  const [netName, setNetName] = useState("");
  const [netTierLabel, setNetTierLabel] = useState("");
  const [netTierRank, setNetTierRank] = useState(1);

  // Agreement form state
  const [targetKind, setTargetKind] = useState<"ORG" | "DIR">("ORG");
  const [targetOrgId, setTargetOrgId] = useState("");
  const [targetDirId, setTargetDirId] = useState("");
  const [agProductType, setAgProductType] = useState<string>("TSS");
  const [agNetworkId, setAgNetworkId] = useState("");
  const [agScope, setAgScope] = useState("ALL_BRANCHES");
  const [agNote, setAgNote] = useState("");
  const [agExcludedBranches, setAgExcludedBranches] = useState("");

  // Representative form state
  const [repName, setRepName] = useState("");
  const [repEmail, setRepEmail] = useState("");
  const [repRoleTitle, setRepRoleTitle] = useState("Network & Provizyon Yöneticisi");

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/organizations/${organization.id}/insurer-workspace`, {
        cache: "no-store",
      });
      if (r.ok) {
        const json = await r.json();
        setData(json);
        const ins = json.insurer || {};
        const org = json.organization || organization;
        setLegalName(ins.legalName || org.legalName || org.name || "");
        setSeddkLicenseRef(ins.seddkLicenseRef || org.seddkLicenseRef || "");
        setTsbMemberCode(ins.tsbMemberCode || org.tsbMemberCode || "");
        setHeadquartersCity(ins.headquartersCity || org.city || "");
        setHeadquartersDistrict(ins.headquartersDistrict || org.district || "");
        setHeadquartersAddress(ins.headquartersAddress || org.address || "");
        setPhone(ins.phone || org.phone || "");
        setClaimsPhone(ins.claimsPhone || org.claimsPhone || org.phone || "");
        setWebsite(ins.website || org.website || "");
        setProvisionPortalUrl(ins.provisionPortalUrl || org.provisionPortalUrl || "");
        setDescription(ins.description || org.description || "");
      }
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  async function runAction(payload: Record<string, unknown>, successMsg: string) {
    setBusy(true);
    setFeedback(null);
    try {
      const r = await fetch(`/api/organizations/${organization.id}/insurer-workspace`, {
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
      setFeedback({ type: "ok", text: successMsg });
      await loadWorkspace();
      return true;
    } finally {
      setBusy(false);
    }
  }

  const insurer = data?.insurer;
  const canOperateLive = Boolean(data?.canOperateLive);
  const products: any[] = data?.products || [];
  const networks: any[] = data?.networks || [];
  const agreements: any[] = data?.agreements || [];
  const representatives: any[] = data?.representatives || [];
  const auditLogs: any[] = data?.auditLogs || [];
  const orgOptions: any[] = data?.availableFacilities?.organizations || [];
  const dirOptions: any[] = data?.availableFacilities?.directoryInstitutions || [];

  const pendingProviderDeclarations = agreements.filter(
    (a) => a.verificationStatus === "PROVIDER_DECLARED"
  );

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "13.5px",
    background: "#ffffff",
    color: "#0f172a",
  };

  return (
    <div className="page" style={{ maxWidth: "1140px" }} data-testid="insurer-workspace-manager">
      {/* Top Corporate Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #115e59 100%)",
          color: "#ffffff",
          borderRadius: "24px",
          padding: "28px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.16)",
                  fontSize: "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                }}
              >
                SİGORTA KURUMU YÖNETİM MERKEZİ
              </span>
              <span
                data-testid="insurer-workspace-status-badge"
                style={{
                  padding: "4px 12px",
                  borderRadius: "999px",
                  background:
                    organization.status === "APPROVED"
                      ? "#10b981"
                      : organization.status === "REJECTED"
                      ? "#ef4444"
                      : "#f59e0b",
                  color: "#022c22",
                  fontSize: "11.5px",
                  fontWeight: 800,
                }}
              >
                {organization.status === "APPROVED"
                  ? "ONAYLI KURUMSAL HESAP"
                  : organization.status === "REJECTED"
                  ? "REDDEDİLDİ"
                  : "DOĞRULAMA İNCELEMESİNDE"}
              </span>
            </div>

            <h1 style={{ margin: "10px 0 4px", fontSize: "28px", fontWeight: 800, color: "#fff" }}>
              {organization.name}
            </h1>
            <div style={{ fontSize: "13.5px", color: "#99f6e4" }}>
              {legalName || organization.name} · SEDDK: {seddkLicenseRef || "Belirtilmedi"}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {insurer?.slug && (
              <Link
                href={`/insurance/${encodeURIComponent(insurer.slug)}`}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "#14b8a6",
                  color: "#042f2e",
                  fontWeight: 800,
                  fontSize: "13px",
                  textDecoration: "none",
                }}
              >
                Kamuya Açık Sigorta Sayfası →
              </Link>
            )}
            <Link
              href="/business"
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.14)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              Kurumlarım
            </Link>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div
          style={{
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(255,255,255,0.16)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", color: "#cbd5e1" }}>AKTİF SİGORTA ÜRÜNÜ</div>
            <div style={{ fontSize: "22px", fontWeight: 800 }}>{products.length}</div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#cbd5e1" }}>SAĞLIK HİZMET AĞI</div>
            <div style={{ fontSize: "22px", fontWeight: 800 }}>{networks.length}</div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#cbd5e1" }}>ANLAŞMALI KURUM</div>
            <div style={{ fontSize: "22px", fontWeight: 800 }}>{agreements.length}</div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#cbd5e1" }}>ONAY BEKLEYEN KURUM BEYANI</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#fde047" }}>
              {pendingProviderDeclarations.length}
            </div>
          </div>
        </div>
      </div>

      {!canOperateLive && (
        <div
          data-testid="insurer-pending-verification-banner"
          style={{
            padding: "16px 20px",
            borderRadius: "16px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            color: "#92400e",
            fontSize: "13.5px",
            marginBottom: "20px",
            fontWeight: 600,
          }}
        >
          Kurumsal sigorta başvurunuz veya zorunlu SEDDK/Ticaret Sicil belgeleriniz henüz yönetici onayından geçmediği için canlı ürün, ağ ve anlaşmalı kurum yayınlama işlemleri kısıtlıdır.
        </div>
      )}

      {feedback && (
        <div
          data-testid="insurer-workspace-feedback"
          style={{
            padding: "12px 16px",
            borderRadius: "12px",
            marginBottom: "18px",
            background: feedback.type === "ok" ? "#dcfce7" : "#fee2e2",
            color: feedback.type === "ok" ? "#166534" : "#991b1b",
            fontWeight: 700,
            fontSize: "13.5px",
          }}
        >
          {feedback.text}
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "24px",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "12px",
        }}
      >
        {(
          [
            ["profile", "Kurumsal Profil & Lisans"],
            ["products", `Sigorta Ürünleri (${products.length})`],
            ["networks", `Anlaşmalı Ağlar (${networks.length})`],
            ["agreements", `Anlaşmalı Kurumlar (${agreements.length})`],
            ["governance", "Yetkili Temsilciler & Belgeler"],
          ] as [WorkspaceTab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            data-testid={`insurer-tab-${key}`}
            onClick={() => setTab(key)}
            style={{
              padding: "10px 16px",
              borderRadius: "12px",
              border: tab === key ? "1px solid #0f766e" : "1px solid #e2e8f0",
              background: tab === key ? "#0f766e" : "#ffffff",
              color: tab === key ? "#ffffff" : "#334155",
              fontWeight: 700,
              fontSize: "13.5px",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <div style={{ padding: "32px", color: "#64748b" }}>Yükleniyor...</div>}

      {/* TAB 1: PROFILE */}
      {!loading && tab === "profile" && (
        <form
          data-testid="insurer-profile-form"
          onSubmit={(e) => {
            e.preventDefault();
            void runAction(
              {
                action: "UPDATE_PROFILE",
                legalName,
                seddkLicenseRef,
                tsbMemberCode,
                headquartersCity,
                headquartersDistrict,
                headquartersAddress,
                phone,
                claimsPhone,
                website,
                provisionPortalUrl,
                description,
              },
              "Kurumsal sigorta profili güncellendi."
            );
          }}
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
            Kurumsal Kimlik, SEDDK Lisans & Provizyon İletişim Bilgileri
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "14px",
            }}
          >
            <label>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#334155" }}>
                Resmi Ticaret Ünvanı
              </span>
              <input
                data-testid="ws-legal-name-input"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#334155" }}>
                SEDDK Ruhsat / Sicil Referans No
              </span>
              <input
                data-testid="ws-seddk-input"
                value={seddkLicenseRef}
                onChange={(e) => setSeddkLicenseRef(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#334155" }}>
                TSB Üye Kodu
              </span>
              <input
                data-testid="ws-tsb-input"
                value={tsbMemberCode}
                onChange={(e) => setTsbMemberCode(e.target.value)}
                style={inputStyle}
              />
            </label>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "14px",
            }}
          >
            <label>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#334155" }}>
                Genel Merkez İl
              </span>
              <input
                value={headquartersCity}
                onChange={(e) => setHeadquartersCity(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#334155" }}>
                Genel Merkez İlçe
              </span>
              <input
                value={headquartersDistrict}
                onChange={(e) => setHeadquartersDistrict(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#334155" }}>
                Provizyon / Hasar Destek Hattı
              </span>
              <input
                data-testid="ws-claims-phone-input"
                value={claimsPhone}
                onChange={(e) => setClaimsPhone(e.target.value)}
                style={inputStyle}
              />
            </label>
          </div>

          <label>
            <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#334155" }}>
              Genel Merkez Açık Adres
            </span>
            <input
              value={headquartersAddress}
              onChange={(e) => setHeadquartersAddress(e.target.value)}
              style={inputStyle}
            />
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "14px",
            }}
          >
            <label>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#334155" }}>
                Kurumsal Web Sitesi
              </span>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#334155" }}>
                Sağlık Kurumu Provizyon Portalı URL
              </span>
              <input
                value={provisionPortalUrl}
                onChange={(e) => setProvisionPortalUrl(e.target.value)}
                style={inputStyle}
              />
            </label>
          </div>

          <label>
            <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#334155" }}>
              Kurumsal Açıklama & Teminat Özeti
            </span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={inputStyle}
            />
          </label>

          <div>
            <button
              type="submit"
              data-testid="ws-save-profile-btn"
              disabled={busy}
              style={{
                padding: "11px 20px",
                borderRadius: "12px",
                border: "none",
                background: "#0f766e",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "13.5px",
                cursor: "pointer",
              }}
            >
              Kurumsal Bilgileri Kaydet
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: PRODUCTS */}
      {!loading && tab === "products" && (
        <div style={{ display: "grid", gap: "20px" }}>
          <form
            data-testid="insurer-product-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await runAction(
                {
                  action: "UPSERT_PRODUCT",
                  code: prodCode,
                  name: prodName,
                  productType: prodType,
                  requiresPublicSgk: prodRequiresSgk,
                },
                "Sigorta ürünü kaydedildi."
              );
              if (ok) {
                setProdCode("");
                setProdName("");
              }
            }}
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              padding: "22px",
              display: "grid",
              gap: "14px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>
              Yeni Sigorta Ürünü Ekle / Güncelle
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px",
              }}
            >
              <input
                data-testid="ws-product-code-input"
                placeholder="Ürün Kodu (Örn: TSS_PLUS)"
                required
                value={prodCode}
                onChange={(e) => setProdCode(e.target.value)}
                style={inputStyle}
              />
              <input
                data-testid="ws-product-name-input"
                placeholder="Ürün Adı (Örn: Tamamlayıcı Sağlık Plus)"
                required
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                style={inputStyle}
              />
              <select
                data-testid="ws-product-type-select"
                value={prodType}
                onChange={(e) => {
                  const pt = e.target.value as InsuranceProductType;
                  setProdType(pt);
                  setProdRequiresSgk(pt === "TSS");
                }}
                style={inputStyle}
              >
                <option value="TSS">TSS — Tamamlayıcı Sağlık</option>
                <option value="OSS">ÖSS — Özel Sağlık</option>
                <option value="TRAVEL">TRAVEL — Seyahat Sağlık</option>
                <option value="FOREIGN_HEALTH">FOREIGN_HEALTH — Yabancı Sağlık</option>
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <input
                  type="checkbox"
                  checked={prodRequiresSgk}
                  onChange={(e) => setProdRequiresSgk(e.target.checked)}
                />
                Aktif SGK hak sahipliği gerektirir (TSS ürünleri için zorunlu)
              </label>
              <button
                type="submit"
                data-testid="ws-add-product-btn"
                disabled={busy}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#0f172a",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Ürünü Kaydet
              </button>
            </div>
          </form>

          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              padding: "22px",
              display: "grid",
              gap: "10px",
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 800 }}>
              Tanımlı Sigorta Ürünleri ({products.length})
            </h3>
            {products.map((p) => (
              <div
                key={p.id}
                data-testid={`ws-product-row-${p.code}`}
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong>{p.name}</strong>{" "}
                  <span style={{ fontSize: "12px", color: "#0f766e", fontWeight: 700 }}>
                    [{p.productType} · {p.code}]
                  </span>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    {p.requiresPublicSgk ? "SGK Etkileşimli" : "Özel Poliçe"}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "999px",
                    background: p.isActive ? "#dcfce7" : "#f1f5f9",
                    color: p.isActive ? "#166534" : "#64748b",
                  }}
                >
                  {p.isActive ? "AKTİF" : "PASİF"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: NETWORKS */}
      {!loading && tab === "networks" && (
        <div style={{ display: "grid", gap: "20px" }}>
          <form
            data-testid="insurer-network-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await runAction(
                {
                  action: "UPSERT_NETWORK",
                  code: netCode,
                  name: netName,
                  tierLabel: netTierLabel || netName,
                  tierRank: netTierRank,
                },
                "Sağlık hizmet ağı kaydedildi."
              );
              if (ok) {
                setNetCode("");
                setNetName("");
                setNetTierLabel("");
              }
            }}
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              padding: "22px",
              display: "grid",
              gap: "14px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>
              Yeni Anlaşmalı Kurum Ağı (Network) Ekle
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px",
              }}
            >
              <input
                data-testid="ws-network-code-input"
                placeholder="Ağ Kodu (Örn: PLATINUM_NET)"
                required
                value={netCode}
                onChange={(e) => setNetCode(e.target.value)}
                style={inputStyle}
              />
              <input
                data-testid="ws-network-name-input"
                placeholder="Ağ Adı (Örn: Platinum Geniş Ağ)"
                required
                value={netName}
                onChange={(e) => setNetName(e.target.value)}
                style={inputStyle}
              />
              <input
                data-testid="ws-network-tier-input"
                placeholder="Kademe Etiketi (Örn: A+ Tüm Kurumlar)"
                value={netTierLabel}
                onChange={(e) => setNetTierLabel(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <button
                type="submit"
                data-testid="ws-add-network-btn"
                disabled={busy}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#0f172a",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Ağı Kaydet
              </button>
            </div>
          </form>

          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              padding: "22px",
              display: "grid",
              gap: "10px",
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 800 }}>
              Tanımlı Sağlık Hizmet Ağları ({networks.length})
            </h3>
            {networks.map((n) => (
              <div
                key={n.id}
                data-testid={`ws-network-row-${n.code}`}
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong>{n.name}</strong>{" "}
                  <span style={{ fontSize: "12px", color: "#0f766e", fontWeight: 700 }}>
                    [{n.code}]
                  </span>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>{n.tierLabel}</div>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "999px",
                    background: n.isActive ? "#dcfce7" : "#f1f5f9",
                    color: n.isActive ? "#166534" : "#64748b",
                  }}
                >
                  {n.isActive ? "AKTİF" : "PASİF"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AGREEMENTS */}
      {!loading && tab === "agreements" && (
        <div style={{ display: "grid", gap: "20px" }}>
          {/* Create / Declare Agreement Form */}
          <form
            data-testid="insurer-agreement-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const rules = agExcludedBranches
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((code) => ({
                  specialtyCode: code.toUpperCase(),
                  ruleKind: "EXCLUDED",
                }));
              const ok = await runAction(
                {
                  action: "CREATE_AGREEMENT",
                  targetOrganizationId: targetKind === "ORG" ? targetOrgId : null,
                  targetDirectoryInstitutionId: targetKind === "DIR" ? targetDirId : null,
                  productType: agProductType || null,
                  networkId: agNetworkId || null,
                  coverageScope: agScope,
                  note: agNote,
                  specialtyRules: rules,
                },
                "Anlaşmalı sağlık kurumu kaydı eklendi."
              );
              if (ok) {
                setAgNote("");
                setAgExcludedBranches("");
              }
            }}
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              padding: "22px",
              display: "grid",
              gap: "14px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>
              Anlaşmalı Sağlık Kurumu Tanımla (Sigorta Şirketi Beyanı)
            </h3>

            <div style={{ display: "flex", gap: "12px", fontSize: "13px", fontWeight: 700 }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="radio"
                  checked={targetKind === "ORG"}
                  onChange={() => setTargetKind("ORG")}
                />
                ALUMAS Onaylı Sağlık Kurumu
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="radio"
                  checked={targetKind === "DIR"}
                  onChange={() => setTargetKind("DIR")}
                />
                Dizin Sağlık Kurumu (Şube Bazlı)
              </label>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "12px",
              }}
            >
              {targetKind === "ORG" ? (
                <select
                  data-testid="ws-agreement-org-select"
                  required
                  value={targetOrgId}
                  onChange={(e) => setTargetOrgId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Sağlık Kurumu Seçin...</option>
                  {orgOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.city})
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  data-testid="ws-agreement-dir-select"
                  required
                  value={targetDirId}
                  onChange={(e) => setTargetDirId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Dizin Kurumu Seçin...</option>
                  {dirOptions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.city})
                    </option>
                  ))}
                </select>
              )}

              <select
                data-testid="ws-agreement-product-type-select"
                value={agProductType}
                onChange={(e) => setAgProductType(e.target.value)}
                style={inputStyle}
              >
                <option value="TSS">TSS — Tamamlayıcı Sağlık</option>
                <option value="OSS">ÖSS — Özel Sağlık</option>
                <option value="TRAVEL">TRAVEL — Seyahat Sağlık</option>
                <option value="FOREIGN_HEALTH">FOREIGN_HEALTH — Yabancı Sağlık</option>
              </select>

              <select
                data-testid="ws-agreement-network-select"
                value={agNetworkId}
                onChange={(e) => setAgNetworkId(e.target.value)}
                style={inputStyle}
              >
                <option value="">Tüm Ağlarda Geçerli</option>
                {networks.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>

              <select
                data-testid="ws-agreement-scope-select"
                value={agScope}
                onChange={(e) => setAgScope(e.target.value)}
                style={inputStyle}
              >
                <option value="ALL_BRANCHES">Tam Kapsam (Yatarak + Ayakta)</option>
                <option value="INPATIENT_ONLY">Sadece Yatarak Tedavi</option>
                <option value="OUTPATIENT_ONLY">Sadece Ayakta Tedavi</option>
                <option value="EMERGENCY_ONLY">Sadece Acil Hizmetler</option>
                <option value="PARTIAL_BRANCH_BASED">Branş Bazlı Kısmi Anlaşma</option>
              </select>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "12px",
              }}
            >
              <input
                placeholder="Kapsam Dışı Branş Kodları (Örn: DIS, ESTETIK)"
                value={agExcludedBranches}
                onChange={(e) => setAgExcludedBranches(e.target.value)}
                style={inputStyle}
              />
              <input
                data-testid="ws-agreement-note-input"
                placeholder="Anlaşma / Katılım Payı Notu"
                value={agNote}
                onChange={(e) => setAgNote(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <button
                type="submit"
                data-testid="ws-create-agreement-btn"
                disabled={busy}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#0f766e",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Anlaşmalı Kurumu Kaydet
              </button>
            </div>
          </form>

          {/* Existing Agreements List with Confirmation / Dispute Actions */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              padding: "22px",
              display: "grid",
              gap: "12px",
            }}
          >
            <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 800 }}>
              Anlaşmalı Sağlık Kurumları & Doğrulama Durumu ({agreements.length})
            </h3>

            {agreements.map((agr) => (
              <div
                key={agr.id}
                data-testid={`ws-agreement-row-${agr.id}`}
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  background:
                    agr.verificationStatus === "PROVIDER_DECLARED" ? "#fffbeb" : "#f8fafc",
                  border:
                    agr.verificationStatus === "PROVIDER_DECLARED"
                      ? "1px solid #fde68a"
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
                    <strong style={{ fontSize: "15px" }}>{agr.facilityName}</strong>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background:
                          agr.verificationStatus === "MUTUALLY_CONFIRMED" ||
                          agr.verificationStatus === "ADMIN_VERIFIED"
                            ? "#dcfce7"
                            : agr.verificationStatus === "INSURER_DECLARED"
                            ? "#ccfbf1"
                            : agr.verificationStatus === "PROVIDER_DECLARED"
                            ? "#fef3c7"
                            : "#fee2e2",
                        color: "#0f172a",
                      }}
                    >
                      {agr.verificationStatus}
                    </span>
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#475569", marginTop: "4px" }}>
                    {agr.facilityCity} · Ürün: {agr.productType || "Tümü"} · Kapsam:{" "}
                    {agr.coverageScope}
                    {agr.networkName ? ` · Ağ: ${agr.networkName}` : ""}
                  </div>
                  {agr.note && (
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                      {agr.note}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {agr.verificationStatus === "PROVIDER_DECLARED" && (
                    <button
                      type="button"
                      data-testid={`ws-confirm-agreement-btn-${agr.id}`}
                      disabled={busy}
                      onClick={() =>
                        void runAction(
                          { action: "CONFIRM_AGREEMENT", agreementId: agr.id },
                          "Sağlık kurumu anlaşma beyanı karşılıklı olarak onaylandı."
                        )
                      }
                      style={{
                        padding: "7px 12px",
                        borderRadius: "8px",
                        border: "none",
                        background: "#059669",
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      ✓ Beyanı Onayla (Karşılıklı Teyit)
                    </button>
                  )}

                  {agr.verificationStatus !== "DISPUTED" && (
                    <button
                      type="button"
                      data-testid={`ws-dispute-agreement-btn-${agr.id}`}
                      disabled={busy}
                      onClick={() =>
                        void runAction(
                          {
                            action: "DISPUTE_AGREEMENT",
                            agreementId: agr.id,
                            reason: "Sigorta şirketi kayıtlarıyla uyuşmuyor.",
                          },
                          "Anlaşma için uyuşmazlık kaydı oluşturuldu."
                        )
                      }
                      style={{
                        padding: "7px 12px",
                        borderRadius: "8px",
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "#b91c1c",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Uyuşmazlık Bildir
                    </button>
                  )}

                  {agr.verificationStatus !== "EXPIRED" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void runAction(
                          { action: "EXPIRE_AGREEMENT", agreementId: agr.id },
                          "Anlaşma süresi sonlandırıldı."
                        )
                      }
                      style={{
                        padding: "7px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#475569",
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
        </div>
      )}

      {/* TAB 5: GOVERNANCE & DOCUMENTS */}
      {!loading && tab === "governance" && (
        <div style={{ display: "grid", gap: "20px" }}>
          <form
            data-testid="insurer-rep-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await runAction(
                {
                  action: "ADD_REPRESENTATIVE",
                  name: repName,
                  email: repEmail,
                  roleTitle: repRoleTitle,
                },
                "Kurumsal yetkili temsilci eklendi."
              );
              if (ok) {
                setRepName("");
                setRepEmail("");
              }
            }}
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              padding: "22px",
              display: "grid",
              gap: "12px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>
              Yetkili Kurumsal Temsilci Ekle
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px",
              }}
            >
              <input
                placeholder="Ad Soyad"
                required
                value={repName}
                onChange={(e) => setRepName(e.target.value)}
                style={inputStyle}
              />
              <input
                type="email"
                placeholder="Kurumsal E-posta"
                required
                value={repEmail}
                onChange={(e) => setRepEmail(e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder="Ünvan / Görev"
                required
                value={repRoleTitle}
                onChange={(e) => setRepRoleTitle(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={busy}
                style={{
                  padding: "9px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#0f172a",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Temsilci Ekle
              </button>
            </div>
          </form>

          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              padding: "22px",
              display: "grid",
              gap: "10px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>
              Yetkili Kurumsal Temsilciler ({representatives.length})
            </h3>
            {representatives.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong>{r.name}</strong> ({r.email}) — {r.roleTitle}
                </div>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f766e" }}>
                  {r.isPrimaryOwner ? "Ana Hesap Sahibi" : r.status}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              padding: "22px",
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 800 }}>
              SEDDK & Kurumsal Doğrulama Belgeleri
            </h3>
            <VerificationDocumentManager
              owner={{
                kind: "organization",
                entityType: "INSURANCE_COMPANY",
                organizationId: organization.id,
              }}
              documents={organization.verificationDocuments || []}
            />
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              padding: "22px",
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 800 }}>
              Son Sigorta Yönetimi İşlem Kayıtları ({auditLogs.length})
            </h3>
            {auditLogs.length === 0 ? (
              <div style={{ fontSize: "13px", color: "#64748b" }}>Henüz işlem kaydı yok.</div>
            ) : (
              <div style={{ display: "grid", gap: "8px" }}>
                {auditLogs.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: "#f8fafc",
                      fontSize: "12.5px",
                      color: "#334155",
                    }}
                  >
                    <strong>{log.action}</strong> ·{" "}
                    {new Date(log.createdAt).toLocaleString("tr-TR")}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
