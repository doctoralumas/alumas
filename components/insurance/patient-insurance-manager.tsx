"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Buildings,
  CheckCircle,
  Compass,
  Info,
  PencilSimple,
  Plus,
  ShieldCheck,
  Sparkle,
  Trash,
  Umbrella,
} from "@phosphor-icons/react";
import {
  usePatientInsurance,
  type PatientInsurancePreferenceItem,
} from "@/lib/use-patient-insurance";
import type { InsuranceProductType } from "@/lib/insurance-domain";

const PRODUCT_TYPE_KEYS: InsuranceProductType[] = [
  "TSS",
  "OSS",
  "TRAVEL",
  "FOREIGN_HEALTH",
  "CRITICAL_ILLNESS",
  "CORPORATE_HEALTH",
];

export default function PatientInsuranceManager({
  isLoggedIn,
  compact = false,
}: {
  isLoggedIn?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations("patientInsurance");
  const {
    insurers,
    preferences,
    loading,
    error,
    setError,
    savePreference,
    setActiveDiscoveryPreference,
    removePreference,
  } = usePatientInsurance({ isLoggedIn });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedInsurerId, setSelectedInsurerId] = useState("");
  const [selectedProductType, setSelectedProductType] = useState<string>("");
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>("");
  const [policyLabel, setPolicyLabel] = useState<string>("");
  const [includePublicSgk, setIncludePublicSgk] = useState<boolean>(true);
  const [makeActive, setMakeActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedInsurer = insurers.find((i) => i.id === selectedInsurerId) || null;
  const availableNetworks = (selectedInsurer?.networks || []).filter(
    (net) => !selectedProductType || !net.productType || net.productType === selectedProductType
  );

  function openNewForm(prefillInsurerId?: string) {
    setError(null);
    setEditingId(null);
    setSelectedInsurerId(prefillInsurerId || insurers[0]?.id || "");
    setSelectedProductType("TSS");
    setSelectedNetworkId("");
    setPolicyLabel("");
    setIncludePublicSgk(true);
    setMakeActive(true);
    setShowForm(true);
  }

  function openEditForm(pref: PatientInsurancePreferenceItem) {
    setError(null);
    setEditingId(pref.id);
    setSelectedInsurerId(pref.insuranceProviderId);
    setSelectedProductType(pref.productType || "");
    setSelectedNetworkId(pref.networkId || "");
    setPolicyLabel(pref.policyLabel || "");
    setIncludePublicSgk(Boolean(pref.includePublicSgk));
    setMakeActive(Boolean(pref.isPrimary));
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await savePreference({
      id: editingId,
      insuranceProviderId: selectedInsurerId,
      productType: (selectedProductType || null) as InsuranceProductType | null,
      networkId: selectedNetworkId || null,
      policyLabel: policyLabel.trim() || null,
      includePublicSgk,
      isPrimary: makeActive,
      isActiveDiscovery: makeActive,
    });
    setSubmitting(false);
    if (res.ok) {
      setShowForm(false);
      setEditingId(null);
    }
  }

  return (
    <section
      data-testid="patient-insurance-manager"
      style={{
        background: "#fff",
        borderRadius: "24px",
        border: "1px solid #e2e8f0",
        padding: compact ? "24px" : "32px",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #0f172a 0%, #0d9488 100%)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Umbrella size={24} weight="duotone" />
          </div>
          <div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.6px",
                color: "#0d9488",
                textTransform: "uppercase",
              }}
            >
              {t("kicker")}
            </span>
            <h2 style={{ margin: "2px 0 0 0", fontSize: compact ? "20px" : "22px", color: "#0f172a" }}>
              {t("title")}
            </h2>
          </div>
        </div>

        {!showForm && (
          <button
            type="button"
            data-testid="add-insurance-preference-btn"
            onClick={() => openNewForm()}
            style={{
              padding: "10px 18px",
              borderRadius: "100px",
              background: "#0f172a",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Plus size={16} weight="bold" />
            {t("addPreferenceButton")}
          </button>
        )}
      </div>

      <p style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.55, margin: "0 0 16px 0" }}>
        {t("subtitle")}
      </p>

      {/* KVKK & Discovery Non-Verification Banner */}
      <div
        data-testid="insurance-kvkk-disclaimer"
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "12px 16px",
          marginBottom: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          fontSize: "12px",
          color: "#475569",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "#0f172a" }}>
          <ShieldCheck size={16} weight="fill" color="#0d9488" />
          <span>{t("kvkkBadge")}:</span>
          <span style={{ fontWeight: 500, color: "#334155" }}>{t("kvkkNotice")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", color: "#64748b" }}>
          <Info size={15} weight="duotone" style={{ flexShrink: 0, marginTop: "1px" }} />
          <span>{t("nonVerificationNotice")}</span>
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          data-testid="insurance-preference-form"
          style={{
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: "20px",
            padding: "20px",
            marginBottom: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a", fontWeight: 700 }}>
            {editingId ? t("editPreferenceTitle") : t("newPreferenceTitle")}
          </h3>

          {error && (
            <div
              data-testid="insurance-form-error"
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                padding: "10px 14px",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "14px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                {t("insurerLabel")}
              </label>
              <select
                data-testid="select-insurer"
                value={selectedInsurerId}
                onChange={(e) => {
                  setSelectedInsurerId(e.target.value);
                  setSelectedNetworkId("");
                }}
                required
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  fontSize: "14px",
                  color: "#0f172a",
                }}
              >
                <option value="">{t("insurerPlaceholder")}</option>
                {insurers.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                {t("productTypeLabel")}
              </label>
              <select
                data-testid="select-product-type"
                value={selectedProductType}
                onChange={(e) => {
                  const nextType = e.target.value;
                  setSelectedProductType(nextType);
                  setSelectedNetworkId("");
                  if (nextType === "TSS") setIncludePublicSgk(true);
                }}
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  fontSize: "14px",
                  color: "#0f172a",
                }}
              >
                <option value="">{t("productTypeUnknown")}</option>
                {PRODUCT_TYPE_KEYS.map((pt) => (
                  <option key={pt} value={pt}>
                    {t(`productTypes.${pt}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                {t("networkLabel")}
              </label>
              <select
                data-testid="select-network"
                value={selectedNetworkId}
                onChange={(e) => setSelectedNetworkId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  fontSize: "14px",
                  color: "#0f172a",
                }}
              >
                <option value="">{t("networkUnknown")}</option>
                {availableNetworks.map((net) => (
                  <option key={net.id} value={net.slug}>
                    {net.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                {t("labelFieldTitle")}
              </label>
              <input
                data-testid="input-policy-label"
                type="text"
                maxLength={60}
                value={policyLabel}
                onChange={(e) => setPolicyLabel(e.target.value)}
                placeholder={t("labelFieldPlaceholder")}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  fontSize: "14px",
                  color: "#0f172a",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: "#334155",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={includePublicSgk}
                onChange={(e) => setIncludePublicSgk(e.target.checked)}
              />
              <span>{t("includeSgkLabel")}</span>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: "#0f172a",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={makeActive}
                onChange={(e) => setMakeActive(e.target.checked)}
              />
              <span>{t("setAsActiveDiscovery")}</span>
            </label>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setError(null);
              }}
              style={{
                padding: "10px 18px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                background: "#fff",
                color: "#475569",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              data-testid="save-insurance-preference-btn"
              disabled={submitting}
              style={{
                padding: "10px 20px",
                borderRadius: "12px",
                border: "none",
                background: "#0d9488",
                color: "#fff",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              {editingId ? t("updatePreference") : t("savePreference")}
            </button>
          </div>
        </form>
      )}

      {/* Saved Preferences List or Empty State */}
      {!loading && preferences.length === 0 ? (
        <div
          data-testid="insurance-empty-state"
          style={{
            padding: "28px 20px",
            borderRadius: "20px",
            border: "1px dashed #cbd5e1",
            background: "#f8fafc",
            textAlign: "center",
          }}
        >
          <Sparkle size={32} weight="duotone" color="#0d9488" style={{ marginBottom: "8px" }} />
          <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#0f172a" }}>
            {t("emptyTitle")}
          </h3>
          <p
            style={{
              margin: "0 auto 16px auto",
              maxWidth: "460px",
              fontSize: "13px",
              color: "#64748b",
              lineHeight: 1.5,
            }}
          >
            {t("emptyDesc")}
          </p>
          {!showForm && (
            <button
              type="button"
              onClick={() => openNewForm()}
              style={{
                padding: "10px 20px",
                borderRadius: "100px",
                background: "#0f172a",
                color: "#fff",
                border: "none",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              + {t("addPreferenceButton")}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {preferences.map((pref) => {
            const isPrimary = pref.isPrimary || pref.isActiveDiscovery;
            const insurerName =
              pref.insuranceProvider?.name ||
              insurers.find((i) => i.id === pref.insuranceProviderId)?.name ||
              pref.insuranceProviderId;

            return (
              <div
                key={pref.id}
                data-testid={`saved-insurance-pref-${pref.insuranceProvider?.slug || pref.insuranceProviderId}`}
                style={{
                  borderRadius: "18px",
                  border: isPrimary ? "2px solid #0d9488" : "1px solid #e2e8f0",
                  background: isPrimary ? "#f0fdfa" : "#fff",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: "17px", color: "#0f172a" }}>{insurerName}</strong>
                      {isPrimary && (
                        <span
                          data-testid="active-discovery-preference-badge"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "#0d9488",
                            color: "#fff",
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: "100px",
                          }}
                        >
                          <CheckCircle size={13} weight="fill" />
                          {t("activeDiscoveryBadge")}
                        </span>
                      )}
                      {pref.policyLabel && (
                        <span
                          style={{
                            background: "#f1f5f9",
                            color: "#334155",
                            fontSize: "12px",
                            fontWeight: 600,
                            padding: "2px 10px",
                            borderRadius: "100px",
                          }}
                        >
                          {pref.policyLabel}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        marginTop: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#0f172a",
                          background: "#e2e8f0",
                          padding: "3px 10px",
                          borderRadius: "8px",
                        }}
                      >
                        {pref.productType
                          ? t(`productTypes.${pref.productType}`)
                          : t("generalProductBadge")}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#0369a1",
                          background: "#e0f2fe",
                          padding: "3px 10px",
                          borderRadius: "8px",
                        }}
                      >
                        {pref.networkName || pref.networkId || t("generalNetworkBadge")}
                      </span>
                      {pref.includePublicSgk && (
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#065f46",
                            background: "#d1fae5",
                            padding: "3px 10px",
                            borderRadius: "8px",
                          }}
                        >
                          {t("sgkCompanionBadge")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {!isPrimary && (
                      <button
                        type="button"
                        data-testid={`set-active-pref-${pref.id}`}
                        onClick={() => setActiveDiscoveryPreference(pref.id)}
                        style={{
                          padding: "7px 12px",
                          borderRadius: "10px",
                          border: "1px solid #0d9488",
                          background: "#fff",
                          color: "#0d9488",
                          fontWeight: 600,
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        {t("makeActiveDiscovery")}
                      </button>
                    )}
                    <button
                      type="button"
                      data-testid={`edit-pref-${pref.id}`}
                      onClick={() => openEditForm(pref)}
                      style={{
                        padding: "7px 10px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        background: "#fff",
                        color: "#334155",
                        fontWeight: 600,
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <PencilSimple size={14} />
                      {t("editAction")}
                    </button>
                    <button
                      type="button"
                      data-testid={`remove-pref-${pref.id}`}
                      onClick={() => removePreference(pref.id)}
                      style={{
                        padding: "7px 10px",
                        borderRadius: "10px",
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "#b91c1c",
                        fontWeight: 600,
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Trash size={14} />
                      {t("removeAction")}
                    </button>
                  </div>
                </div>

                {isPrimary && (
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      paddingTop: "8px",
                      borderTop: "1px solid rgba(13, 148, 136, 0.2)",
                    }}
                  >
                    <Link
                      href="/organizations"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 14px",
                        borderRadius: "10px",
                        background: "#0f172a",
                        color: "#fff",
                        textDecoration: "none",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      <Buildings size={15} weight="duotone" />
                      {t("exploreOrganizationsCta")}
                    </Link>
                    <Link
                      href="/nearby"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 14px",
                        borderRadius: "10px",
                        background: "#fff",
                        color: "#0f172a",
                        border: "1px solid #cbd5e1",
                        textDecoration: "none",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      <Compass size={15} weight="duotone" />
                      {t("exploreNearbyCta")}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

