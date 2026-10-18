"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DocumentUploadFields } from "@/components/verification-document-fields";
import { useTranslations } from "next-intl";

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
    try {
      const r = await fetch("/api/organizations", { method: "POST", body: new FormData(f) });
      if (r.status === 413) {
        setMsg(t("fileVercelLimit"));
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
        return;
      }
      await r.json();
      setMsg(t("submitSuccess"));
      setTimeout(() => router.push("/business"), 700);
    } catch (err: any) {
      setMsg(err.message || t("genericError"));
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
      style={{ display: "flex", flexDirection: "column", gap: "16px" }}
    >
      {hasExistingOwnedOrgs && (
        <div
          data-testid="existing-owned-orgs-banner"
          style={{
            padding: "12px 16px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "12px",
            color: "#166534",
            fontSize: "13.5px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <span>{t("existingOwnedOrgsBanner")}</span>
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
            padding: "14px 16px",
            borderRadius: "12px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            fontSize: "13.5px",
            lineHeight: 1.5,
            fontWeight: 500,
          }}
        >
          {t("invalidClaimDirectoryWarning", { id: initialClaimDirectoryId })}
        </div>
      )}

      {/* Mode Selector: New Institution vs Claim Existing Directory Institution */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          padding: "6px",
          background: "#f1f5f9",
          borderRadius: "12px",
          flexWrap: "wrap",
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
            flex: 1,
            padding: "10px 16px",
            borderRadius: "8px",
            border: "none",
            background: mode === "NEW" ? "#0f172a" : "transparent",
            color: mode === "NEW" ? "#fff" : "#475569",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t("modeNewInstitution")}
        </button>
        <button
          type="button"
          data-testid="mode-claim-directory-btn"
          onClick={() => setMode("CLAIM")}
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: "8px",
            border: "none",
            background: mode === "CLAIM" ? "#0f172a" : "transparent",
            color: mode === "CLAIM" ? "#fff" : "#475569",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t("modeClaimDirectory")}
        </button>
      </div>

      <div
        style={{
          padding: "12px 16px",
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "12px",
          color: "#1e3a8a",
          fontSize: "13px",
          lineHeight: "1.5",
        }}
      >
        {t("verificationReviewNotice")}
      </div>

      {mode === "CLAIM" && (
        <div
          style={{
            padding: "16px",
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <label style={{ margin: 0 }}>
            <span style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>
              {t("selectDirectoryInstitutionLabel")} <Req />
            </span>
            <select
              data-testid="claim-directory-select"
              value={selectedDirId}
              onChange={(e) => handleDirectorySelect(e.target.value)}
              required={mode === "CLAIM"}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#fff",
                fontSize: "14px",
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
                padding: "14px 16px",
                borderRadius: "10px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
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
                    fontSize: "11.5px",
                    fontWeight: 700,
                    background: "#dbeafe",
                    color: "#1e40af",
                    padding: "4px 10px",
                    borderRadius: "999px",
                  }}
                >
                  {t("claimedBranchBadge")}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDirId("")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#2563eb",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >
                  {t("changeClaimedInstitution")}
                </button>
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                {t("claimGateTitle", { name: activeSelectedOption.name })}
              </div>
              <div style={{ fontSize: "12.5px", color: "#475569", lineHeight: 1.45 }}>
                {t("claimGateBranchScopeNotice", {
                  name: activeSelectedOption.name,
                  city: activeSelectedOption.city,
                })}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {t("claimedBranchLockedHint")}
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
              }}
            >
              {t("alreadyClaimedWarning", { name: activeSelectedOption.name })}
            </div>
          )}
        </div>
      )}

      <div className="org-type-select" style={{ marginBottom: "12px" }}>
        {orgTypeOptions.map((x) => (
          <button
            type="button"
            className={type === x[0] ? "selected" : ""}
            key={x[0]}
            disabled={isBranchIdentityLocked && type !== x[0]}
            onClick={() => {
              if (!isBranchIdentityLocked) setType(x[0]);
            }}
            style={
              isBranchIdentityLocked && type !== x[0]
                ? { opacity: 0.45, cursor: "not-allowed" }
                : undefined
            }
          >
            {x[1]}
          </button>
        ))}
      </div>
      <input type="hidden" name="type" value={type} />

      <div className="form-pair" style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <label style={{ flex: 2, minWidth: "240px" }}>
          <span style={{ fontWeight: "500" }}>
            {t("nameLabel")} <Req />
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
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              marginTop: "6px",
              background: isBranchIdentityLocked ? "#f1f5f9" : "#ffffff",
            }}
          />
        </label>
        <label style={{ flex: 1, minWidth: "200px" }}>
          <span style={{ fontWeight: "500" }}>
            {t("applicantRoleLabel")} <Req />
          </span>
          <input
            name="applicantRoleTitle"
            data-testid="claim-form-role-input"
            required
            value={applicantRoleTitle}
            onChange={(e) => setApplicantRoleTitle(e.target.value)}
            placeholder={t("applicantRolePlaceholder")}
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "6px" }}
          />
        </label>
      </div>

      <div className="form-pair" style={{ display: "flex", gap: "16px" }}>
        <label style={{ flex: 1 }}>
          <span style={{ fontWeight: "500" }}>
            {t("cityLabel")} <Req />
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
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              marginTop: "6px",
              background: isBranchIdentityLocked ? "#f1f5f9" : "#ffffff",
            }}
          />
        </label>
        <label style={{ flex: 1 }}>
          <span style={{ fontWeight: "500" }}>{t("districtLabel")}</span>
          <input
            name="district"
            data-testid="claim-form-district-input"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder={t("districtPlaceholder")}
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "6px" }}
          />
        </label>
      </div>
      <label>
        <span style={{ fontWeight: "500" }}>
          {t("addressLabel")} <Req />
        </span>
        <input
          name="address"
          data-testid="claim-form-address-input"
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t("addressPlaceholder")}
          style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "6px" }}
        />
      </label>
      <div className="form-pair" style={{ display: "flex", gap: "16px" }}>
        <label style={{ flex: 1 }}>
          <span style={{ fontWeight: "500" }}>
            {t("phoneLabel")} <Req />
          </span>
          <input
            name="phone"
            data-testid="claim-form-phone-input"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("phonePlaceholder")}
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "6px" }}
          />
        </label>
        <label style={{ flex: 1 }}>
          <span style={{ fontWeight: "500" }}>
            {t("emailLabel")} <Req />
          </span>
          <input
            name="email"
            data-testid="claim-form-email-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "6px" }}
          />
        </label>
      </div>
      <label>
        <span style={{ fontWeight: "500" }}>{t("websiteLabel")}</span>
        <input
          name="website"
          data-testid="claim-form-website-input"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder={t("websitePlaceholder")}
          style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "6px" }}
        />
      </label>
      <label>
        <span style={{ fontWeight: "500" }}>{t("descLabel")}</span>
        <textarea
          name="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("descPlaceholder")}
          style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "6px" }}
        />
      </label>
      {mode === "CLAIM" && (
        <label>
          <span style={{ fontWeight: "500" }}>{t("claimNoteLabel")}</span>
          <textarea
            name="applicantNote"
            data-testid="claim-form-note-input"
            rows={2}
            value={applicantNote}
            onChange={(e) => setApplicantNote(e.target.value)}
            placeholder={t("claimNotePlaceholder")}
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "6px" }}
          />
        </label>
      )}
      <DocumentUploadFields kind="organization" entityType={type} />
      {msg && (
        <div
          className="inline-message"
          style={{
            padding: "12px",
            borderRadius: "8px",
            background: msg === t("submitSuccess") ? "#dcfce3" : "#fee2e2",
            color: msg === t("submitSuccess") ? "#166534" : "#991b1b",
            fontWeight: "500",
          }}
        >
          {msg}
        </div>
      )}
      <button
        className="primary"
        data-testid="claim-form-submit-btn"
        type="submit"
        disabled={isSelectedBranchAlreadyClaimed}
        style={{
          padding: "14px",
          fontSize: "16px",
          fontWeight: "600",
          marginTop: "8px",
          borderRadius: "8px",
          opacity: isSelectedBranchAlreadyClaimed ? 0.55 : 1,
          cursor: isSelectedBranchAlreadyClaimed ? "not-allowed" : "pointer",
        }}
      >
        {mode === "CLAIM" ? t("submitClaimButton") : t("submitButton")}
      </button>
    </form>
  );
}
