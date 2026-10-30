import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { findEnrichedInsurer } from "@/lib/insurance-ecosystem-store";
import { isInsurerPubliclyDiscoverable } from "@/lib/insurance-domain";

export const dynamic = "force-dynamic";

export default async function InsurerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = String(rawSlug || "").trim();
  if (!slug || slug === "alumas-demo-sigorta") {
    return notFound();
  }

  const found = await findEnrichedInsurer(slug);
  if (!found || !isInsurerPubliclyDiscoverable(found.insurer)) {
    return notFound();
  }

  const tIns = await getTranslations("patientInsurance");
  const tCommon = await getTranslations("common");

  const { insurer, products, networks, agreements } = found;
  const activeProducts = products.filter((p) => p.isActive !== false);
  const activeNetworks = networks.filter((n) => n.isActive !== false);

  const visibleAgreements = agreements.filter(
    (a) =>
      a.isActive &&
      a.verificationStatus !== "DISPUTED" &&
      a.verificationStatus !== "EXPIRED"
  );

  const confirmedAgreements = visibleAgreements.filter(
    (a) =>
      a.verificationStatus === "MUTUALLY_CONFIRMED" ||
      a.verificationStatus === "ADMIN_VERIFIED" ||
      a.verificationStatus === "INSURER_DECLARED"
  );

  const declaredAgreements = visibleAgreements.filter(
    (a) =>
      a.verificationStatus === "PROVIDER_DECLARED" ||
      a.verificationStatus === "UNVERIFIED"
  );

  return (
    <div className="page" style={{ maxWidth: "1080px" }} data-testid="insurer-profile-page">
      <div style={{ marginBottom: "20px" }}>
        <Link
          href="/insurance"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "#0f766e",
            fontWeight: 700,
            fontSize: "13.5px",
            textDecoration: "none",
          }}
        >
          ← {tIns("backToInsuranceDirectory")}
        </Link>
      </div>

      {/* Corporate Header Card */}
      <div
        data-testid="insurer-profile-header"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #134e4a 100%)",
          color: "#ffffff",
          borderRadius: "24px",
          padding: "32px",
          marginBottom: "28px",
          boxShadow: "0 12px 32px rgba(15, 23, 42, 0.14)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 420px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.14)",
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {tIns("insurerInstitutionCategory")}
              </span>

              {insurer.isVerifiedOrganization ? (
                <span
                  data-testid="insurer-profile-verified-badge"
                  style={{
                    padding: "4px 12px",
                    borderRadius: "999px",
                    background: "#10b981",
                    color: "#022c22",
                    fontSize: "11.5px",
                    fontWeight: 800,
                  }}
                >
                  ✓ {tIns("verifiedInsurerBadge")}
                </span>
              ) : (
                <span
                  data-testid="insurer-profile-catalog-badge"
                  style={{
                    padding: "4px 12px",
                    borderRadius: "999px",
                    background: "rgba(248, 250, 252, 0.16)",
                    color: "#e2e8f0",
                    border: "1px solid rgba(255,255,255,0.28)",
                    fontSize: "11.5px",
                    fontWeight: 700,
                  }}
                >
                  {tIns("catalogUnclaimedBadge")}
                </span>
              )}
            </div>

            <h1 style={{ margin: "12px 0 4px", fontSize: "32px", fontWeight: 800, color: "#ffffff" }}>
              {insurer.name}
            </h1>
            {insurer.legalName && (
              <div style={{ fontSize: "14px", color: "#99f6e4", fontWeight: 600 }}>
                {insurer.legalName}
              </div>
            )}

            <p
              style={{
                margin: "14px 0 0",
                fontSize: "15px",
                color: "#cbd5e1",
                lineHeight: 1.6,
                maxWidth: "680px",
              }}
            >
              {insurer.description}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              minWidth: "240px",
            }}
          >
            <Link
              href={`/organizations?insuranceSlug=${encodeURIComponent(insurer.slug)}`}
              data-testid="insurer-profile-discover-cta"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 18px",
                borderRadius: "12px",
                background: "#14b8a6",
                color: "#042f2e",
                fontWeight: 800,
                fontSize: "13.5px",
                textDecoration: "none",
              }}
            >
              {tIns("discoverContractedFacilitiesCta")} →
            </Link>

            {insurer.canClaim && !insurer.isVerifiedOrganization && (
              <Link
                href={`/business/apply?type=INSURANCE_COMPANY&claimInsurerSlug=${encodeURIComponent(insurer.slug)}`}
                data-testid="insurer-profile-claim-cta"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px 16px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.12)",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.28)",
                  fontWeight: 700,
                  fontSize: "13px",
                  textDecoration: "none",
                }}
              >
                {tIns("claimInsurerProfileCta")}
              </Link>
            )}

            {insurer.verifiedOrganizationSlug && (
              <Link
                href={`/organizations/${encodeURIComponent(insurer.verifiedOrganizationSlug)}`}
                data-testid="insurer-profile-org-link"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px 16px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.14)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "13px",
                  textDecoration: "none",
                }}
              >
                {tIns("viewVerifiedCorporatePage")}
              </Link>
            )}
          </div>
        </div>

        {/* Corporate & Regulatory Credentials Grid */}
        <div
          style={{
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid rgba(255,255,255,0.14)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "16px",
            fontSize: "13px",
          }}
        >
          <div>
            <div style={{ color: "#94a3b8", fontSize: "11px", textTransform: "uppercase" }}>
              {tIns("seddkLicenseLabel")}
            </div>
            <div style={{ fontWeight: 700, marginTop: "3px" }}>
              {insurer.seddkLicenseRef || "—"}
            </div>
          </div>
          <div>
            <div style={{ color: "#94a3b8", fontSize: "11px", textTransform: "uppercase" }}>
              {tIns("tsbMemberCodeLabel")}
            </div>
            <div style={{ fontWeight: 700, marginTop: "3px" }}>
              {insurer.tsbMemberCode || "—"}
            </div>
          </div>
          <div>
            <div style={{ color: "#94a3b8", fontSize: "11px", textTransform: "uppercase" }}>
              {tIns("hqLabel")}
            </div>
            <div style={{ fontWeight: 700, marginTop: "3px" }}>
              {insurer.headquartersCity || "—"}
              {insurer.headquartersDistrict ? ` / ${insurer.headquartersDistrict}` : ""}
            </div>
          </div>
          <div>
            <div style={{ color: "#94a3b8", fontSize: "11px", textTransform: "uppercase" }}>
              {tIns("claimsSupportPhoneLabel")}
            </div>
            <div style={{ fontWeight: 700, marginTop: "3px" }}>
              {insurer.claimsPhone || insurer.phone || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Products & Networks Two-Column Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        {/* Insurance Products */}
        <div
          data-testid="insurer-products-section"
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
            padding: "24px",
          }}
        >
          <h2 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
            {tIns("supportedProductsTitle")} ({activeProducts.length})
          </h2>
          <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b" }}>
            {tIns("supportedProductsSubtitle")}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {activeProducts.map((prod) => (
              <div
                key={prod.id}
                data-testid={`insurer-product-item-${prod.code}`}
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: "#ccfbf1",
                        color: "#115e59",
                        fontSize: "11px",
                        fontWeight: 800,
                      }}
                    >
                      {prod.productType}
                    </span>
                    <strong style={{ fontSize: "14px", color: "#0f172a" }}>{prod.name}</strong>
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                    {prod.requiresPublicSgk
                      ? tIns("requiresSgkBadge")
                      : tIns("privateCoverageBadge")}
                  </div>
                </div>

                <Link
                  href={`/organizations?insuranceSlug=${encodeURIComponent(insurer.slug)}&insuranceProductType=${encodeURIComponent(prod.productType)}`}
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#0d9488",
                    textDecoration: "none",
                  }}
                >
                  {tIns("filterByProductCta")} →
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Insurance Networks */}
        <div
          data-testid="insurer-networks-section"
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
            padding: "24px",
          }}
        >
          <h2 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
            {tIns("providerNetworksTitle")} ({activeNetworks.length})
          </h2>
          <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b" }}>
            {tIns("providerNetworksSubtitle")}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {activeNetworks.map((net) => (
              <div
                key={net.id}
                data-testid={`insurer-network-item-${net.code}`}
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong style={{ fontSize: "14px", color: "#0f172a", display: "block" }}>
                    {net.name}
                  </strong>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>
                    {net.tierLabel || net.code}
                  </div>
                </div>

                <Link
                  href={`/organizations?insuranceSlug=${encodeURIComponent(insurer.slug)}&insuranceNetworkId=${encodeURIComponent(net.id)}`}
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#0d9488",
                    textDecoration: "none",
                  }}
                >
                  {tIns("filterByNetworkCta")} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contracted Healthcare Providers Section */}
      <div
        data-testid="insurer-contracted-providers-section"
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          padding: "24px",
          marginBottom: "48px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "18px",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
              {tIns("contractedHealthcareProvidersTitle")}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
              {tIns("contractedHealthcareProvidersSubtitle")}
            </p>
          </div>
          <Link
            href={`/organizations?insuranceSlug=${encodeURIComponent(insurer.slug)}`}
            style={{
              padding: "9px 14px",
              borderRadius: "10px",
              background: "#f0fdfa",
              color: "#0f766e",
              border: "1px solid #99f6e4",
              fontSize: "12.5px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            {tIns("openInInstitutionDirectory")} →
          </Link>
        </div>

        {/* Confirmed Agreements */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 800, color: "#047857" }}>
            ✓ {tIns("confirmedAgreementsSectionTitle")} ({confirmedAgreements.length})
          </h3>

          {confirmedAgreements.length === 0 ? (
            <div
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: "#f8fafc",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              {tIns("noConfirmedAgreementsYet")}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "14px",
              }}
            >
              {confirmedAgreements.map((agr) => (
                <div
                  key={agr.id}
                  data-testid={`insurer-confirmed-agreement-${agr.id}`}
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                    <strong style={{ fontSize: "15px", color: "#0f172a" }}>
                      {agr.facilityName}
                    </strong>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background: "#dcfce7",
                        color: "#166534",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {agr.verificationStatus === "MUTUALLY_CONFIRMED"
                        ? tIns("statusMutuallyConfirmed")
                        : agr.verificationStatus === "ADMIN_VERIFIED"
                          ? tIns("statusAdminVerified")
                          : tIns("statusInsurerDeclared")}
                    </span>
                  </div>

                  <div style={{ fontSize: "12.5px", color: "#475569" }}>
                    {agr.facilityCity} · {agr.productType || tCommon("all")}
                    {agr.networkName ? ` · ${agr.networkName}` : ""}
                  </div>

                  {agr.note && (
                    <div style={{ fontSize: "12px", color: "#334155" }}>{agr.note}</div>
                  )}

                  {agr.facilitySlug && !agr.isExternalDirectoryFacility && (
                    <Link
                      href={`/organizations/${encodeURIComponent(agr.facilitySlug)}`}
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#047857",
                        textDecoration: "none",
                        marginTop: "4px",
                      }}
                    >
                      {tIns("viewFacilityProfile")} →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Provider-Declared Agreements */}
        {declaredAgreements.length > 0 && (
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 800, color: "#b45309" }}>
              ◔ {tIns("declaredAgreementsSectionTitle")} ({declaredAgreements.length})
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "14px",
              }}
            >
              {declaredAgreements.map((agr) => (
                <div
                  key={agr.id}
                  data-testid={`insurer-declared-agreement-${agr.id}`}
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                    <strong style={{ fontSize: "15px", color: "#0f172a" }}>
                      {agr.facilityName}
                    </strong>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background: "#fef3c7",
                        color: "#92400e",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {tIns("statusProviderDeclared")}
                    </span>
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#475569" }}>
                    {agr.facilityCity} · {agr.productType || tCommon("all")}
                    {agr.networkName ? ` · ${agr.networkName}` : ""}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#92400e" }}>
                    {tIns("providerDeclaredDisclaimer")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
