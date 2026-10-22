"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DocumentUploadFields } from "@/components/verification-document-fields";
import { useTranslations } from "next-intl";
import {
  Buildings,
  Hospital,
  FirstAid,
  Pill,
  Flask,
  ShieldCheck,
  WarningCircle,
  ArrowRight,
  UserCheck,
  ChatCenteredText,
  Lock,
  SpinnerGap,
} from "@phosphor-icons/react";

const ORG_TYPES = ["HOSPITAL", "CLINIC", "PHARMACY", "IMAGING_CENTER", "LABORATORY"] as const;
type OrgType = (typeof ORG_TYPES)[number];

export type ClaimedDirectorySummary = {
  id: string;
  directoryId?: string | null;
  slug: string;
  type: OrgType;
  name: string;
  city: string;
  district?: string | null;
  address: string;
  phone: string;
  officialWebsite?: string | null;
  description?: string | null;
  canClaim?: boolean;
};

type DirectoryOption = ClaimedDirectorySummary;

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "44px",
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  outline: "none",
  background: "#ffffff",
  color: "#0f172a",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  fontFamily: "inherit",
};

const lockedInputStyle: React.CSSProperties = {
  ...inputStyle,
  background: "#f8fafc",
  borderColor: "#e2e8f0",
  color: "#334155",
  cursor: "not-allowed",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "88px",
  lineHeight: "1.5",
  resize: "vertical",
};

const labelSpanStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: "13px",
  fontWeight: 600,
  color: "#334155",
  marginBottom: "6px",
};

const lockedBadgeStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#0f766e",
  background: "#ccfbf1",
  padding: "2px 8px",
  borderRadius: "100px",
  display: "inline-flex",
  alignItems: "center",
  gap: "3px",
};

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        paddingBottom: "12px",
        borderBottom: "1px solid #f1f5f9",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: "#f0fdfa",
          border: "1px solid #ccfbf1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#0f766e",
          flexShrink: 0,
          marginTop: "2px",
        }}
      >
        <Icon size={20} weight="duotone" />
      </div>
      <div>
        <h2
          style={{
            margin: "0 0 4px",
            fontSize: "16px",
            fontWeight: 700,
            color: "#0f172a",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>
        {description && (
          <p style={{ margin: 0, color: "#64748b", fontSize: "13px", lineHeight: 1.5 }}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function BusinessApplicationForm({
  initialType,
  initialClaimDirectoryId,
  initialClaimInstitution = null,
  claimLookupFailed = false,
  hasExistingOwnedOrgs = false,
}: {
  initialType?: string;
  initialClaimDirectoryId?: string;
  initialClaimInstitution?: ClaimedDirectorySummary | null;
  claimLookupFailed?: boolean;
  hasExistingOwnedOrgs?: boolean;
}) {
  const t = useTranslations("professional.businessApply");
  const start = ORG_TYPES.includes(
    String(initialClaimInstitution?.type || initialType || "").toUpperCase() as OrgType
  )
    ? (String(initialClaimInstitution?.type || initialType).toUpperCase() as OrgType)
    : "CLINIC";

  const [mode, setMode] = useState<"NEW" | "CLAIM">(
    initialClaimInstitution || initialClaimDirectoryId ? "CLAIM" : "NEW"
  );
  const [directoryOptions, setDirectoryOptions] = useState<DirectoryOption[]>(
    initialClaimInstitution ? [initialClaimInstitution] : []
  );
  const [selectedDirId, setSelectedDirId] = useState<string>(
    initialClaimInstitution
      ? initialClaimInstitution.directoryId || initialClaimInstitution.id
      : initialClaimDirectoryId && !claimLookupFailed
      ? initialClaimDirectoryId
      : ""
  );

  const [type, setType] = useState<OrgType>(start);
  const [name, setName] = useState(initialClaimInstitution?.name || "");
  const [city, setCity] = useState(initialClaimInstitution?.city || "");
  const [district, setDistrict] = useState(initialClaimInstitution?.district || "");
  const [address, setAddress] = useState(initialClaimInstitution?.address || "");
  const [phone, setPhone] = useState(initialClaimInstitution?.phone || "");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(initialClaimInstitution?.officialWebsite || "");
  const [description, setDescription] = useState(initialClaimInstitution?.description || "");
  const [applicantRoleTitle, setApplicantRoleTitle] = useState("");
  const [applicantNote, setApplicantNote] = useState("");
  const [msg, setMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  function applyDirectorySelection(option: DirectoryOption | undefined) {
    if (!option) return;
    if (ORG_TYPES.includes(option.type)) setType(option.type);
    setName(option.name || "");
    setCity(option.city || "");
    setDistrict(option.district || "");
    setAddress(option.address || "");
    setPhone(option.phone || "");
    setWebsite(option.officialWebsite || "");
    setDescription(option.description || "");
  }

  useEffect(() => {
    let active = true;
    fetch("/api/organizations?unclaimedOnly=1")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: DirectoryOption[]) => {
        if (!active || !Array.isArray(list)) return;
        const merged = [...list];
        if (
          initialClaimInstitution &&
          !merged.some(
            (item) =>
              (item.directoryId || item.id) ===
              (initialClaimInstitution.directoryId || initialClaimInstitution.id)
          )
        ) {
          merged.unshift(initialClaimInstitution);
        }
        setDirectoryOptions(merged);

        if (initialClaimDirectoryId && !initialClaimInstitution) {
          const found = merged.find(
            (item) =>
              item.id === initialClaimDirectoryId ||
              item.directoryId === initialClaimDirectoryId ||
              item.slug === initialClaimDirectoryId
          );
          if (found) {
            setSelectedDirId(found.directoryId || found.id);
            applyDirectorySelection(found);
          }
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [initialClaimDirectoryId, initialClaimInstitution]);

  function handleDirectorySelect(nextId: string) {
    setSelectedDirId(nextId);
    const found = directoryOptions.find((item) => (item.directoryId || item.id) === nextId);
    if (found) applyDirectorySelection(found);
  }

  const activeSelectedOption =
    directoryOptions.find((item) => (item.directoryId || item.id) === selectedDirId) ||
    (initialClaimInstitution &&
    (initialClaimInstitution.directoryId || initialClaimInstitution.id) === selectedDirId
      ? initialClaimInstitution
      : undefined);

  const isBranchIdentityLocked = mode === "CLAIM" && Boolean(selectedDirId && activeSelectedOption);
  const isSelectedBranchAlreadyClaimed =
    mode === "CLAIM" && Boolean(activeSelectedOption && activeSelectedOption.canClaim === false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSelectedBranchAlreadyClaimed && activeSelectedOption) {
      setMsg(t("alreadyClaimedWarning", { name: activeSelectedOption.name }));
      return;
    }
    const f = e.currentTarget;
    const tooLarge = [...f.querySelectorAll('input[type="file"]')].some(
      (input) =>
        (input as HTMLInputElement).files?.[0] &&
        (input as HTMLInputElement).files![0].size > 4.5 * 1024 * 1024
    );
    if (tooLarge) {
      setMsg(t("fileTooLarge"));
      return;
    }
    setMsg(t("submitting"));
    setIsSubmitting(true);
    try {
      const r = await fetch("/api/organizations", { method: "POST", body: new FormData(f) });
      if (r.status === 413) {
        setMsg(t("fileVercelLimit"));
        setIsSubmitting(false);
        return;
      }
      if (!r.ok) {
        const text = await r.text();
        try {
          const j = JSON.parse(text);
          setMsg(j.error || t("submitFailed"));
        } catch {
          setMsg(t("serverError", { status: r.status }));
        }
        setIsSubmitting(false);
        return;
      }
      await r.json();
      setMsg(t("submitSuccess"));
      setTimeout(() => router.push("/business"), 700);
    } catch (err: any) {
      setMsg(err.message || t("genericError"));
      setIsSubmitting(false);
    }
  }

  const Req = () => <span style={{ color: "#ef4444", marginLeft: "4px", fontWeight: "bold" }}>*</span>;

  const orgTypeOptions: [OrgType, string][] = [
    ["HOSPITAL", t("tabHospital")],
    ["CLINIC", t("tabClinic")],
    ["PHARMACY", t("tabPharmacy")],
    ["IMAGING_CENTER", t("tabImaging")],
    ["LABORATORY", t("tabLab")],
  ];

  return (
    <form
      className="business-form premium-form"
      data-testid="business-application-form"
      onSubmit={submit}
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {/* Existing Organizations Banner */}
      {hasExistingOwnedOrgs && (
        <div
          data-testid="existing-owned-orgs-banner"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "14px 18px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "14px",
            color: "#166534",
            fontSize: "13.5px",
            lineHeight: 1.5,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Buildings size={20} weight="duotone" color="#16a34a" />
            <span>{t("existingOwnedOrgsBanner")}</span>
          </div>
          <Link
            href="/business"
            style={{
              fontWeight: 700,
              color: "#15803d",
              textDecoration: "underline",
              whiteSpace: "nowrap",
            }}
          >
            {t("goToBusinessDashboard")}
          </Link>
        </div>
      )}

      {claimLookupFailed && initialClaimDirectoryId && (
        <div
          data-testid="claim-invalid-id-warning"
          style={{
            padding: "14px 18px",
            borderRadius: "14px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            fontSize: "13.5px",
            lineHeight: 1.5,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <WarningCircle size={20} weight="fill" color="#dc2626" style={{ flexShrink: 0 }} />
          <span>{t("invalidClaimDirectoryWarning", { id: initialClaimDirectoryId })}</span>
        </div>
      )}

      {/* Mode Selector: New Institution Application vs Claim Directory Institution */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6px",
          padding: "6px",
          background: "#f1f5f9",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
        }}
      >
        <button
          type="button"
          data-testid="mode-new-institution-btn"
          onClick={() => {
            setMode("NEW");
            setSelectedDirId("");
          }}
          style={{
            padding: "11px 16px",
            borderRadius: "10px",
            border: "none",
            background: mode === "NEW" ? "#0f172a" : "transparent",
            color: mode === "NEW" ? "#ffffff" : "#475569",
            fontWeight: mode === "NEW" ? 700 : 600,
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: mode === "NEW" ? "0 2px 8px rgba(15,23,42,0.12)" : "none",
            transition: "all 0.15s ease",
          }}
        >
          {t("modeNewInstitution")}
        </button>
        <button
          type="button"
          data-testid="mode-claim-directory-btn"
          onClick={() => setMode("CLAIM")}
          style={{
            padding: "11px 16px",
            borderRadius: "10px",
            border: "none",
            background: mode === "CLAIM" ? "#0f172a" : "transparent",
            color: mode === "CLAIM" ? "#ffffff" : "#475569",
            fontWeight: mode === "CLAIM" ? 700 : 600,
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: mode === "CLAIM" ? "0 2px 8px rgba(15,23,42,0.12)" : "none",
            transition: "all 0.15s ease",
          }}
        >
          {t("modeClaimDirectory")}
        </button>
      </div>

      {/* Verification Policy Notice */}
      <div
        style={{
          padding: "14px 18px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          color: "#334155",
          fontSize: "13px",
          lineHeight: 1.5,
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
        }}
      >
        <ShieldCheck size={20} weight="duotone" color="#0d9488" style={{ flexShrink: 0, marginTop: "2px" }} />
        <span>{t("verificationReviewNotice")}</span>
      </div>

      {/* Claim Mode: Directory Institution Selection */}
      {mode === "CLAIM" && (
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            padding: "clamp(16px, 3vw, 20px)",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <label style={{ margin: 0 }}>
            <span style={{ fontWeight: 650, display: "block", marginBottom: "8px", fontSize: "14px", color: "#0f172a" }}>
              {t("selectDirectoryInstitutionLabel")} <Req />
            </span>
            <select
              data-testid="claim-directory-select"
              value={selectedDirId}
              onChange={(e) => handleDirectorySelect(e.target.value)}
              required={mode === "CLAIM"}
              style={{
                width: "100%",
                minHeight: "44px",
                padding: "10px 14px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                fontSize: "14px",
                color: "#0f172a",
                outline: "none",
                fontFamily: "inherit",
              }}
            >
              <option value="">{t("selectDirectoryInstitutionPlaceholder")}</option>
              {directoryOptions.map((item) => {
                const val = item.directoryId || item.id;
                return (
                  <option key={val} value={val}>
                    {item.name} — {item.city}
                    {item.district ? ` / ${item.district}` : ""}
                  </option>
                );
              })}
            </select>
            <input type="hidden" name="directoryInstitutionId" value={selectedDirId} />
          </label>

          {activeSelectedOption && (
            <div
              data-testid="claimed-branch-summary"
              style={{
                background: "linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)",
                border: "1px solid #99f6e4",
                borderRadius: "14px",
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    background: "#ccfbf1",
                    color: "#0f766e",
                    padding: "3px 10px",
                    borderRadius: "100px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <ShieldCheck size={14} weight="bold" />
                  {t("claimedBranchBadge")}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDirId("")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#0d9488",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >
                  {t("changeClaimedInstitution")}
                </button>
              </div>

              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginBottom: "3px" }}>
                  {activeSelectedOption.name}
                </div>
                <div style={{ fontSize: "13px", color: "#475569", lineHeight: 1.45 }}>
                  <strong>
                    {activeSelectedOption.city}
                    {activeSelectedOption.district ? ` / ${activeSelectedOption.district}` : ""}
                  </strong>
                  {activeSelectedOption.address ? ` — ${activeSelectedOption.address}` : ""}
                </div>
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#0f766e",
                  background: "#ffffff",
                  border: "1px solid #ccfbf1",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Lock size={14} weight="bold" />
                <span>{t("claimedBranchLockedHint")}</span>
              </div>
            </div>
          )}

          {isSelectedBranchAlreadyClaimed && activeSelectedOption && (
            <div
              data-testid="claim-already-active-notice"
              style={{
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                color: "#92400e",
                fontSize: "13px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <WarningCircle size={18} weight="fill" color="#b45309" />
              <span>{t("alreadyClaimedWarning", { name: activeSelectedOption.name })}</span>
            </div>
          )}
        </div>
      )}

      {/* Section 1: Facility Information */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "18px",
          padding: "clamp(16px, 3vw, 22px)",
          boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.03)",
        }}
      >
        <SectionHeader
          icon={Buildings}
          title={t("sectionFacility")}
          description={t("sectionFacilityDesc")}
        />

        {/* Facility Type Selector */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
            {t("tabHospital")}, {t("tabClinic")}, {t("tabPharmacy")}... <Req />
            {isBranchIdentityLocked && (
              <span
                style={{
                  marginLeft: "8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#0f766e",
                  background: "#ccfbf1",
                  padding: "2px 8px",
                  borderRadius: "100px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                <Lock size={12} weight="bold" />
                {t("lockedTypeHint")}
              </span>
            )}
          </label>
          <div
            className="org-type-select"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              margin: 0,
            }}
          >
            {orgTypeOptions.map((x) => {
              const isSelected = type === x[0];
              const isLockedDisabled = isBranchIdentityLocked && !isSelected;
              return (
                <button
                  type="button"
                  key={x[0]}
                  className={isSelected ? "selected" : ""}
                  disabled={isLockedDisabled}
                  onClick={() => {
                    if (!isBranchIdentityLocked) setType(x[0]);
                  }}
                  style={{
                    padding: "9px 16px",
                    borderRadius: "100px",
                    fontSize: "13px",
                    fontWeight: isSelected ? 700 : 600,
                    border: isSelected ? "1px solid #0f172a" : "1px solid #cbd5e1",
                    background: isSelected ? "#0f172a" : "#ffffff",
                    color: isSelected ? "#ffffff" : "#475569",
                    cursor: isLockedDisabled ? "not-allowed" : "pointer",
                    opacity: isLockedDisabled ? 0.45 : 1,
                    transition: "all 0.15s ease",
                  }}
                >
                  {x[1]}
                </button>
              );
            })}
          </div>
        </div>
        <input type="hidden" name="type" value={type} />

        {/* Facility Name */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block" }}>
            <span style={labelSpanStyle}>
              <span>{t("nameLabel")} <Req /></span>
              {isBranchIdentityLocked && (
                <span style={lockedBadgeStyle}>
                  <Lock size={12} weight="bold" />
                  {t("lockedFieldBadge")}
                </span>
              )}
            </span>
            <input
              name="name"
              data-testid="claim-form-name-input"
              required
              readOnly={isBranchIdentityLocked}
              value={name}
              onChange={(e) => {
                if (!isBranchIdentityLocked) setName(e.target.value);
              }}
              placeholder={t("namePlaceholder")}
              style={isBranchIdentityLocked ? lockedInputStyle : inputStyle}
              onFocus={(e) => {
                if (!isBranchIdentityLocked) {
                  e.target.style.borderColor = "#0d9488";
                  e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.12)";
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = isBranchIdentityLocked ? "#e2e8f0" : "#cbd5e1";
                e.target.style.boxShadow = "none";
              }}
            />
          </label>
        </div>

        {/* City and District Responsive Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <label style={{ display: "block", minWidth: 0 }}>
            <span style={labelSpanStyle}>
              <span>{t("cityLabel")} <Req /></span>
              {isBranchIdentityLocked && (
                <span style={lockedBadgeStyle}>
                  <Lock size={12} weight="bold" />
                  {t("lockedFieldBadge")}
                </span>
              )}
            </span>
            <input
              name="city"
              data-testid="claim-form-city-input"
              required
              readOnly={isBranchIdentityLocked}
              value={city}
              onChange={(e) => {
                if (!isBranchIdentityLocked) setCity(e.target.value);
              }}
              placeholder={t("cityPlaceholder")}
              style={isBranchIdentityLocked ? lockedInputStyle : inputStyle}
              onFocus={(e) => {
                if (!isBranchIdentityLocked) {
                  e.target.style.borderColor = "#0d9488";
                  e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.12)";
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = isBranchIdentityLocked ? "#e2e8f0" : "#cbd5e1";
                e.target.style.boxShadow = "none";
              }}
            />
          </label>
          <label style={{ display: "block", minWidth: 0 }}>
            <span style={labelSpanStyle}>
              <span>{t("districtLabel")}</span>
            </span>
            <input
              name="district"
              data-testid="claim-form-district-input"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder={t("districtPlaceholder")}
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "#0d9488";
                e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#cbd5e1";
                e.target.style.boxShadow = "none";
              }}
            />
          </label>
        </div>

        {/* Full Address */}
        <div>
          <label style={{ display: "block" }}>
            <span style={labelSpanStyle}>
              <span>{t("addressLabel")} <Req /></span>
            </span>
            <input
              name="address"
              data-testid="claim-form-address-input"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("addressPlaceholder")}
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "#0d9488";
                e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#cbd5e1";
                e.target.style.boxShadow = "none";
              }}
            />
          </label>
        </div>
      </div>

      {/* Section 2: Authorized Representative & Contact */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "18px",
          padding: "clamp(16px, 3vw, 22px)",
          boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.03)",
        }}
      >
        <SectionHeader
          icon={UserCheck}
          title={t("sectionContact")}
          description={t("sectionContactDesc")}
        />

        {/* Applicant Role / Title */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block" }}>
            <span style={labelSpanStyle}>
              <span>{t("applicantRoleLabel")} <Req /></span>
            </span>
            <input
              name="applicantRoleTitle"
              data-testid="claim-form-role-input"
              required
              value={applicantRoleTitle}
              onChange={(e) => setApplicantRoleTitle(e.target.value)}
              placeholder={t("applicantRolePlaceholder")}
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "#0d9488";
                e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#cbd5e1";
                e.target.style.boxShadow = "none";
              }}
            />
          </label>
        </div>

        {/* Phone & Email Responsive Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <label style={{ display: "block", minWidth: 0 }}>
            <span style={labelSpanStyle}>
              <span>{t("phoneLabel")} <Req /></span>
            </span>
            <input
              name="phone"
              data-testid="claim-form-phone-input"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("phonePlaceholder")}
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "#0d9488";
                e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#cbd5e1";
                e.target.style.boxShadow = "none";
              }}
            />
          </label>
          <label style={{ display: "block", minWidth: 0 }}>
            <span style={labelSpanStyle}>
              <span>{t("emailLabel")} <Req /></span>
            </span>
            <input
              name="email"
              data-testid="claim-form-email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "#0d9488";
                e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#cbd5e1";
                e.target.style.boxShadow = "none";
              }}
            />
          </label>
        </div>

        {/* Official Website */}
        <div>
          <label style={{ display: "block" }}>
            <span style={labelSpanStyle}>
              <span>{t("websiteLabel")}</span>
            </span>
            <input
              name="website"
              data-testid="claim-form-website-input"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder={t("websitePlaceholder")}
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "#0d9488";
                e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#cbd5e1";
                e.target.style.boxShadow = "none";
              }}
            />
          </label>
        </div>
      </div>

      {/* Section 3: Facility Profile & Application Notes */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "18px",
          padding: "clamp(16px, 3vw, 22px)",
          boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.03)",
        }}
      >
        <SectionHeader
          icon={ChatCenteredText}
          title={t("sectionProfile")}
          description={t("sectionProfileDesc")}
        />

        {/* Facility Description */}
        <div style={{ marginBottom: mode === "CLAIM" ? "16px" : 0 }}>
          <label style={{ display: "block" }}>
            <span style={labelSpanStyle}>
              <span>{t("descLabel")}</span>
            </span>
            <textarea
              name="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descPlaceholder")}
              style={textareaStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "#0d9488";
                e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#cbd5e1";
                e.target.style.boxShadow = "none";
              }}
            />
          </label>
        </div>

        {/* Claim Note */}
        {mode === "CLAIM" && (
          <div>
            <label style={{ display: "block" }}>
              <span style={labelSpanStyle}>
                <span>{t("claimNoteLabel")}</span>
              </span>
              <textarea
                name="applicantNote"
                data-testid="claim-form-note-input"
                rows={2}
                value={applicantNote}
                onChange={(e) => setApplicantNote(e.target.value)}
                placeholder={t("claimNotePlaceholder")}
                style={textareaStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "#0d9488";
                  e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#cbd5e1";
                  e.target.style.boxShadow = "none";
                }}
              />
            </label>
          </div>
        )}
      </div>

      {/* Section 4: Verification Documents */}
      <DocumentUploadFields kind="organization" entityType={type} />

      {/* Section 5: Trust Banner & Submit Action */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          marginTop: "4px",
        }}
      >
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "14px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "13px",
            color: "#475569",
            lineHeight: 1.5,
          }}
        >
          <Lock size={18} weight="fill" color="#0d9488" style={{ flexShrink: 0 }} />
          <span>{t("secureSubmissionNotice")}</span>
        </div>

        {msg && (
          <div
            className="inline-message"
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              background: msg === t("submitSuccess") ? "#dcfce3" : "#fee2e2",
              color: msg === t("submitSuccess") ? "#166534" : "#991b1b",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            {msg}
          </div>
        )}

        <button
          className="primary"
          data-testid="claim-form-submit-btn"
          type="submit"
          disabled={isSelectedBranchAlreadyClaimed || isSubmitting}
          style={{
            minHeight: "52px",
            padding: "14px 28px",
            fontSize: "15.5px",
            fontWeight: 700,
            borderRadius: "14px",
            background: "#0f172a",
            color: "#ffffff",
            border: "none",
            cursor: isSelectedBranchAlreadyClaimed || isSubmitting ? "not-allowed" : "pointer",
            opacity: isSelectedBranchAlreadyClaimed || isSubmitting ? 0.6 : 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(15,23,42,0.15)",
            transition: "all 0.15s ease",
            width: "100%",
          }}
        >
          {isSubmitting ? (
            <>
              <SpinnerGap size={18} className="animate-spin" />
              <span>{t("submitting")}</span>
            </>
          ) : (
            <>
              <span>{mode === "CLAIM" ? t("submitClaimButton") : t("submitButton")}</span>
              <ArrowRight size={18} weight="bold" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
