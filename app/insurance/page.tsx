"use client";

import SectionVisual from "@/components/section-visual";
import PatientInsuranceManager from "@/components/insurance/patient-insurance-manager";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Umbrella,
  PhoneCall,
  Globe,
  CaretRight,
  CheckCircle,
  Buildings,
  MagnifyingGlass,
  IdentificationBadge,
  ArrowSquareOut,
  SealQuestion,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import type { PublicInsurerCatalogItem } from "@/lib/use-patient-insurance";
import type { InsuranceProductType } from "@/lib/insurance-domain";

const PRODUCT_FILTERS: Array<{ value: "ALL" | InsuranceProductType; code: string }> = [
  { value: "ALL", code: "ALL" },
  { value: "TSS", code: "TSS" },
  { value: "OSS", code: "OSS" },
  { value: "TRAVEL", code: "TRAVEL" },
  { value: "FOREIGN_HEALTH", code: "FOREIGN_HEALTH" },
];

export default function Page() {
  const t = useTranslations("discovery");
  const tIns = useTranslations("patientInsurance");
  const tCommon = useTranslations("common");
  const [rows, setRows] = useState<PublicInsurerCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [productFilter, setProductFilter] = useState<"ALL" | InsuranceProductType>("ALL");

  useEffect(() => {
    fetch("/api/insurance")
      .then((r) => r.json())
      .then((x) =>
        setRows(
          Array.isArray(x)
            ? x.filter((item) => item.slug !== "alumas-demo-sigorta")
            : []
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase("tr-TR");
    return rows.filter((r) => {
      if (productFilter !== "ALL") {
        const types = r.supportedProductTypes || [];
        if (!types.includes(productFilter)) return false;
      }
      if (!q) return true;
      const hay = [
        r.name,
        r.legalName || "",
        r.slug,
        r.headquartersCity || "",
        r.seddkLicenseRef || "",
        ...(r.networks || []).map((n) => n.name),
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");
      return hay.includes(q);
    });
  }, [rows, searchQuery, productFilter]);

  return (
    <div className="page" style={{ maxWidth: "1060px" }}>
      <SectionVisual slug="insurance" alt={t("insuranceTitle")} />

      <div
        style={{
          marginBottom: "28px",
          display: "flex",
          gap: "24px",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: "300px" }}>
          <span className="kicker" style={{ color: "#0d9488" }}>
            {t("insuranceNetworksKicker")}
          </span>
          <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "8px 0" }}>
            {t("insuranceNetworksTitle")}
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "16px", lineHeight: "1.5" }}>
            {t("insuranceNetworksSubtitle")}
          </p>
        </div>
        <div
          style={{
            background: "#f0fdfa",
            padding: "16px 24px",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            border: "1px solid #99f6e4",
          }}
        >
          <Umbrella size={32} weight="duotone" color="#0d9488" />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f766e" }}>
              {t("insuranceFullCoverage")}
            </div>
            <div style={{ fontSize: "12px", color: "#0d9488" }}>{t("insuranceVerified")}</div>
          </div>
        </div>
      </div>

      {/* Patient Insurance Preferences Manager */}
      <div style={{ marginBottom: "36px" }}>
        <PatientInsuranceManager />
      </div>

      {/* Insurer Corporate Registration & Directory Search Bar */}
      <div
        data-testid="insurance-directory-controls"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "20px",
          padding: "20px",
          marginBottom: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
              {tIns("directoryHeaderTitle")}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
              {tIns("directoryHeaderSubtitle")}
            </p>
          </div>
          <Link
            href="/business/apply?type=INSURANCE_COMPANY"
            data-testid="insurer-corporate-apply-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "12px",
              background: "#0f172a",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <IdentificationBadge size={18} weight="bold" />
            {tIns("registerOrClaimInsurerCta")}
          </Link>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: "1 1 260px",
            }}
          >
            <MagnifyingGlass
              size={18}
              color="#64748b"
              style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              data-testid="insurer-directory-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tIns("searchInsurerPlaceholder")}
              style={{
                width: "100%",
                padding: "10px 14px 10px 40px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {PRODUCT_FILTERS.map((pf) => {
              const active = productFilter === pf.value;
              return (
                <button
                  key={pf.value}
                  type="button"
                  data-testid={`insurer-filter-${pf.value}`}
                  onClick={() => setProductFilter(pf.value)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "10px",
                    border: active ? "1px solid #0d9488" : "1px solid #e2e8f0",
                    background: active ? "#f0fdfa" : "#f8fafc",
                    color: active ? "#0f766e" : "#475569",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {pf.value === "ALL" ? tCommon("all") : pf.code}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
          {tCommon("loading")}
        </div>
      )}

      {!loading && filteredRows.length === 0 && (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            background: "#f8fafc",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
            color: "#64748b",
            marginBottom: "48px",
          }}
        >
          {tIns("noInsurersMatchingFilter")}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "24px",
          marginBottom: "48px",
        }}
      >
        {filteredRows.map((r) => {
          const isVerifiedOrg = Boolean(r.isVerifiedOrganization);
          const confirmedCount = Number(r.confirmedAgreementCount || 0);
          const declaredCount = Number(r.declaredAgreementCount || 0);

          return (
            <div
              key={r.id}
              data-testid={`insurer-catalog-card-${r.slug}`}
              style={{
                background: "#fff",
                borderRadius: "24px",
                padding: "24px",
                border: isVerifiedOrg ? "1.5px solid #99f6e4" : "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.2s",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
              }}
              className="hover-shadow"
            >
              <ShieldCheck
                size={120}
                weight="duotone"
                color="#f1f5f9"
                style={{ position: "absolute", right: "-20px", bottom: "-20px", zIndex: 0 }}
              />

              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  flex: 1,
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
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: "20px", color: "#0f172a", fontWeight: 800 }}>
                      <Link
                        href={`/insurance/${encodeURIComponent(r.slug)}`}
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        {r.name}
                      </Link>
                    </h3>
                    {r.legalName && (
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                        {r.legalName}
                      </div>
                    )}
                  </div>

                  {isVerifiedOrg ? (
                    <span
                      data-testid={`insurer-verified-badge-${r.slug}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        background: "#ecfdf5",
                        color: "#047857",
                        border: "1px solid #a7f3d0",
                        fontSize: "11px",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <CheckCircle size={14} weight="fill" />
                      {tIns("verifiedInsurerBadge")}
                    </span>
                  ) : (
                    <span
                      data-testid={`insurer-catalog-badge-${r.slug}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        background: "#f8fafc",
                        color: "#475569",
                        border: "1px solid #cbd5e1",
                        fontSize: "11px",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <SealQuestion size={14} weight="duotone" />
                      {tIns("catalogUnclaimedBadge")}
                    </span>
                  )}
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: "13.5px",
                    color: "#475569",
                    lineHeight: "1.5",
                    flex: 1,
                  }}
                >
                  {r.description || t("insuranceDefaultDesc")}
                </p>

                {/* Regulatory & Headquarters Strip */}
                {(r.seddkLicenseRef || r.headquartersCity) && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      fontSize: "11.5px",
                      color: "#475569",
                      background: "#f8fafc",
                      padding: "8px 10px",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {r.headquartersCity && (
                      <span>
                        <strong>{tIns("hqLabel")}:</strong> {r.headquartersCity}
                        {r.headquartersDistrict ? ` / ${r.headquartersDistrict}` : ""}
                      </span>
                    )}
                    {r.seddkLicenseRef && (
                      <span>
                        <strong>SEDDK:</strong> {r.seddkLicenseRef}
                      </span>
                    )}
                  </div>
                )}

                {/* Supported Product Types & Networks Preview */}
                {(r.supportedProductTypes?.length || r.networks?.length) ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {(r.supportedProductTypes || []).map((pt) => (
                      <span
                        key={pt}
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          background: "#f0fdfa",
                          color: "#0f766e",
                          border: "1px solid #99f6e4",
                          padding: "3px 8px",
                          borderRadius: "8px",
                        }}
                      >
                        {pt}
                      </span>
                    ))}
                    {(r.networks || []).slice(0, 2).map((net) => (
                      <span
                        key={net.id}
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          background: "#f8fafc",
                          color: "#334155",
                          border: "1px solid #e2e8f0",
                          padding: "3px 8px",
                          borderRadius: "8px",
                        }}
                      >
                        {net.name}
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* Contracted Provider Count Strip */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    color: "#334155",
                    paddingTop: "4px",
                  }}
                >
                  <span>
                    <strong>{confirmedCount}</strong> {tIns("confirmedAgreementsShort")}
                    {declaredCount > 0 ? ` · ${declaredCount} ${tIns("declaredAgreementsShort")}` : ""}
                  </span>
                  {r.canClaim !== false && !isVerifiedOrg && (
                    <Link
                      href={`/business/apply?type=INSURANCE_COMPANY&claimInsurerSlug=${encodeURIComponent(r.slug)}`}
                      data-testid={`insurer-claim-link-${r.slug}`}
                      style={{
                        fontSize: "11.5px",
                        fontWeight: 700,
                        color: "#0d9488",
                        textDecoration: "none",
                      }}
                    >
                      {tIns("claimProfileShort")} →
                    </Link>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    paddingTop: "12px",
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  {(r.claimsPhone || r.phone) && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#334155",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      <PhoneCall size={16} color="#0d9488" weight="duotone" />
                      <span>{r.claimsPhone || r.phone}</span>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                    <Link
                      href={`/insurance/${encodeURIComponent(r.slug)}`}
                      data-testid={`insurer-profile-link-${r.slug}`}
                      style={{
                        flex: 1,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        color: "#ffffff",
                        background: "#0d9488",
                        fontWeight: 700,
                        fontSize: "13px",
                        textDecoration: "none",
                        padding: "9px 12px",
                        borderRadius: "10px",
                      }}
                    >
                      <Buildings size={16} weight="bold" />
                      {tIns("viewInsurerProfileCta")}
                    </Link>

                    <Link
                      href={`/organizations?insuranceSlug=${encodeURIComponent(r.slug)}`}
                      data-testid={`insurer-explore-facilities-${r.slug}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "5px",
                        color: "#0f766e",
                        background: "#f0fdfa",
                        border: "1px solid #99f6e4",
                        fontWeight: 700,
                        fontSize: "12.5px",
                        textDecoration: "none",
                        padding: "9px 12px",
                        borderRadius: "10px",
                      }}
                    >
                      {tIns("exploreInsurerFacilities")}
                      <CaretRight size={13} weight="bold" />
                    </Link>

                    {r.website && (
                      <a
                        href={r.website}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${r.name} website`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#475569",
                          fontWeight: 600,
                          fontSize: "13px",
                          textDecoration: "none",
                          padding: "9px 10px",
                          background: "#f8fafc",
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <Globe size={16} color="#64748b" />
                        <ArrowSquareOut size={13} style={{ marginLeft: "3px" }} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
