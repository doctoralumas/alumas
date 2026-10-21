"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Star,
  MapPin,
  Stethoscope,
  CaretRight,
  VideoCamera,
  ChatCircleText,
  MagnifyingGlass,
  Funnel,
  ShieldCheck,
  Clock,
  Globe,
  ArrowSquareOut,
  Buildings,
  Phone,
  XCircle,
} from "@phosphor-icons/react";
import { useTranslations, useLocale } from "next-intl";
import type { NormalizedExpertItem } from "@/lib/expert-directory";
import {
  getAvailableCanonicalSpecialties,
  matchesSpecialtyFilter,
} from "@/lib/specialty-taxonomy";
import ResponsiveSelect from "@/components/ui/responsive-select";

export default function DoctorClientList({
  doctors,
  profileId,
  initialSearch = "",
  initialSpecialty = "",
  initialCity = "",
}: {
  doctors: NormalizedExpertItem[];
  profileId?: string;
  initialSearch?: string;
  initialSpecialty?: string;
  initialCity?: string;
}) {
  const t = useTranslations("discovery");
  const locale = useLocale();

  const [search, setSearch] = useState(initialSearch);
  const [filterSpecialty, setFilterSpecialty] = useState(initialSpecialty);
  const [filterCity, setFilterCity] = useState(initialCity);

  const getPresenceColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return { bg: "#dcfce7", text: "#16a34a", label: t("statusAvailable"), dot: "#22c55e" };
      case "ONLINE":
        return { bg: "#e0f2fe", text: "#0284c7", label: t("statusOnline"), dot: "#0ea5e9" };
      case "BUSY":
        return { bg: "#fee2e2", text: "#dc2626", label: t("statusBusy"), dot: "#ef4444" };
      default:
        return { bg: "#f1f5f9", text: "#64748b", label: t("statusOffline"), dot: "#94a3b8" };
    }
  };

  // 1. Normalized, Deduplicated Canonical Specialties
  const specialtyOptions = useMemo(() => {
    const canonicals = getAvailableCanonicalSpecialties(doctors, locale);
    return canonicals.map((c) => ({
      value: c.id,
      label: c.label,
      count: c.count,
    }));
  }, [doctors, locale]);

  // 2. Normalized, Deduplicated City Options
  const cityOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of doctors) {
      if (!d.city) continue;
      const c = d.city.trim();
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    const list = Array.from(counts.entries()).map(([city, count]) => ({
      value: city,
      label: city,
      count,
    }));
    return list.sort((a, b) => a.label.localeCompare(b.label, locale === "en" ? "en" : "tr"));
  }, [doctors, locale]);

  // 3. Multi-Criteria Search & Filter Logic
  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr-TR");

    return doctors.filter((d) => {
      // Free-text query matching name, title, specialty, hospital, city, or district
      const matchSearch =
        !q ||
        d.name.toLocaleLowerCase("tr-TR").includes(q) ||
        (d.title && d.title.toLocaleLowerCase("tr-TR").includes(q)) ||
        d.specialty.toLocaleLowerCase("tr-TR").includes(q) ||
        (d.hospital && d.hospital.toLocaleLowerCase("tr-TR").includes(q)) ||
        d.city.toLocaleLowerCase("tr-TR").includes(q) ||
        (d.district && d.district.toLocaleLowerCase("tr-TR").includes(q));

      // Canonical specialty matching
      const matchSpecialty = matchesSpecialtyFilter(d.specialty, filterSpecialty);

      // City matching
      const matchCity = filterCity ? d.city.trim().toLowerCase() === filterCity.trim().toLowerCase() : true;

      return matchSearch && matchSpecialty && matchCity;
    });
  }, [doctors, search, filterSpecialty, filterCity]);

  const hasActiveFilters = Boolean(search || filterSpecialty || filterCity);

  const clearAllFilters = () => {
    setSearch("");
    setFilterSpecialty("");
    setFilterCity("");
  };

  return (
    <>
      {/* Responsive Filter Bar */}
      <div
        className="doctor-filter-bar"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 0.8fr)",
          gap: "12px",
          marginBottom: "16px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Search Input */}
        <div style={{ position: "relative", width: "100%", minWidth: 0 }}>
          <MagnifyingGlass
            size={18}
            color="#64748b"
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchDoctorPlaceholder")}
            aria-label={t("searchDoctorPlaceholder")}
            style={{
              width: "100%",
              minHeight: "48px",
              padding: "12px 14px 12px 42px",
              borderRadius: "16px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.15s ease, box-shadow 0.15s ease",
              background: "#fff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#2563eb";
              e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#cbd5e1";
              e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)";
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label={t("clearFilters")}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                color: "#94a3b8",
              }}
            >
              <XCircle size={16} weight="fill" />
            </button>
          )}
        </div>

        {/* Canonical Specialty Responsive Selector */}
        <div style={{ width: "100%", minWidth: 0 }}>
          <ResponsiveSelect
            value={filterSpecialty}
            onChange={setFilterSpecialty}
            options={specialtyOptions}
            placeholder={t("allSpecialties")}
            allOptionLabel={t("allSpecialties")}
            ariaLabel={t("filterSpecialty")}
            searchPlaceholder={t("specialtySearchPlaceholder")}
            noResultsText={t("noSpecialtiesFound")}
            clearText={t("clearFilters")}
            icon={<Funnel size={16} />}
            testId="specialty-filter-select"
          />
        </div>

        {/* City Responsive Selector */}
        <div style={{ width: "100%", minWidth: 0 }}>
          <ResponsiveSelect
            value={filterCity}
            onChange={setFilterCity}
            options={cityOptions}
            placeholder={t("allCities")}
            allOptionLabel={t("allCities")}
            ariaLabel={t("filterCity")}
            searchPlaceholder={t("citySearchPlaceholder")}
            noResultsText={t("noCitiesFound")}
            clearText={t("clearFilters")}
            icon={<MapPin size={16} />}
            testId="city-filter-select"
          />
        </div>
      </div>

      {/* Filter Status Strip & Clear Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "8px",
          fontSize: "13px",
          color: "#64748b",
        }}
      >
        <span>
          {t("showingResults", { count: filtered.length })}
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            data-testid="clear-filters-btn"
            onClick={clearAllFilters}
            style={{
              background: "transparent",
              border: "none",
              color: "#2563eb",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              borderRadius: "8px",
              fontSize: "13px",
            }}
          >
            <XCircle size={15} weight="bold" /> {t("clearFilters")}
          </button>
        )}
      </div>

      {/* Professional Cards Responsive Grid */}
      <div
        className="doctor-cards-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 330px), 1fr))",
          gap: "20px",
          marginBottom: "48px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {filtered.map((d) => {
          const isRegistered = Boolean(d.doctorId);
          const isVerified = d.isVerified === true;
          const presence = getPresenceColor(d.presenceStatus);
          const initials = d.name
            .split(" ")
            .filter(Boolean)
            .slice(-2)
            .map((x) => x[0])
            .join("")
            .toUpperCase();

          const internalProfileHref = isRegistered
            ? `/doctors/${d.slug}${profileId ? `?profileId=${profileId}` : ""}`
            : null;

          const claimHref = `/pro/register?claimDoctorId=${encodeURIComponent(d.directoryId || d.id)}`;

          // Accurate source attribution
          const isOfficialRegistry = d.isOfficialSource === true;
          const isPersonalWebsite = d.source === "SRC-INDEPENDENT-WEBSITE";

          return (
            <div
              key={d.id}
              data-testid={`directory-card-${d.slug}`}
              style={{
                background: "#fff",
                borderRadius: "20px",
                padding: "20px",
                border: isVerified ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                textDecoration: "none",
                color: "inherit",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                boxShadow: "0 2px 8px -2px rgba(15,23,42,0.04)",
                width: "100%",
                maxWidth: "100%",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
              className="hover-shadow"
            >
              {/* Badge & Claim Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  flexWrap: "wrap",
                  minHeight: "26px",
                }}
              >
                <div>
                  {isVerified ? (
                    <div
                      data-testid="alumas-verified-badge"
                      title={t("claimedByVerifiedDoctor")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#1d4ed8",
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        padding: "3px 10px",
                        borderRadius: "100px",
                      }}
                    >
                      <ShieldCheck size={14} weight="fill" color="#2563eb" /> {t("claimedByVerifiedDoctor")}
                    </div>
                  ) : d.verificationState === "PENDING_CLAIM" ? (
                    <div
                      data-testid="pending-claim-badge"
                      title={t("claimDoctorPending")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#b45309",
                        background: "#fffbeb",
                        border: "1px solid #fde68a",
                        padding: "3px 10px",
                        borderRadius: "100px",
                      }}
                    >
                      <Clock size={14} weight="duotone" /> {t("claimDoctorPending")}
                    </div>
                  ) : isOfficialRegistry ? (
                    <div
                      data-testid="external-directory-badge"
                      title={t("officialRegistryTooltip")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#0f766e",
                        background: "#f0fdfa",
                        border: "1px solid #ccfbf1",
                        padding: "3px 10px",
                        borderRadius: "100px",
                      }}
                    >
                      <Globe size={14} weight="duotone" /> {t("officialRegistryRecord")}
                    </div>
                  ) : (
                    <div
                      data-testid="external-directory-badge"
                      title={t("directorySourceTooltip")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#475569",
                        background: "#f1f5f9",
                        padding: "3px 10px",
                        borderRadius: "100px",
                      }}
                    >
                      <Globe size={14} weight="duotone" /> {t("externalDirectoryListing")}
                    </div>
                  )}
                </div>

                {!isVerified && d.canClaim && (
                  <Link
                    data-testid="claim-doctor-link"
                    href={claimHref}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#2563eb",
                      textDecoration: "none",
                      padding: "4px 9px",
                      borderRadius: "8px",
                      background: "#eff6ff",
                      transition: "all 0.15s",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("claimDoctor")}
                  </Link>
                )}
              </div>

              {/* Profile Card Body */}
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", minWidth: 0 }}>
                {/* Avatar */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "16px",
                      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#475569",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    {initials}
                  </div>
                  {isRegistered && (
                    <div
                      title={presence.label}
                      style={{
                        position: "absolute",
                        bottom: "-2px",
                        right: "-2px",
                        width: "14px",
                        height: "14px",
                        background: presence.dot,
                        borderRadius: "50%",
                        border: "2.5px solid #fff",
                      }}
                    />
                  )}
                </div>

                {/* Name, Specialty & Practice */}
                <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      color: "#0f172a",
                      fontWeight: 700,
                      lineHeight: "1.35",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {d.navigationMode === "INTERNAL" && internalProfileHref ? (
                      <Link
                        href={internalProfileHref}
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        {d.title ? `${d.title} ` : ""}
                        {d.name}
                      </Link>
                    ) : d.navigationMode === "EXTERNAL" && d.primaryHref ? (
                      <a
                        href={d.primaryHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t("externalSiteNotice")}
                        style={{
                          color: "inherit",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          maxWidth: "100%",
                        }}
                      >
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {d.title ? `${d.title} ` : ""}
                          {d.name}
                        </span>
                        <ArrowSquareOut size={14} color="#64748b" style={{ flexShrink: 0 }} />
                      </a>
                    ) : (
                      <span>
                        {d.title ? `${d.title} ` : ""}
                        {d.name}
                      </span>
                    )}
                  </h3>

                  <div
                    style={{
                      color: "#2563eb",
                      fontSize: "13px",
                      fontWeight: 600,
                      marginTop: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Stethoscope size={14} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                      {d.specialty}
                    </span>
                  </div>

                  {d.hospital && (
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "12px",
                        marginTop: "3px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={d.hospital}
                    >
                      <Buildings size={13} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                        {d.hospital}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Location & Trust Attribution Strip */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  background: "#f8fafc",
                  padding: "8px 12px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    color: "#475569",
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    minWidth: 0,
                  }}
                  title={`${d.city}${d.district ? `, ${d.district}` : ""}`}
                >
                  <MapPin size={14} style={{ flexShrink: 0, color: "#64748b" }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    {d.city}
                    {d.district ? `, ${d.district}` : ""}
                  </span>
                </div>

                {isRegistered ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      color: "#d97706",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    <Star size={13} weight="fill" />
                    {d.reviewCount > 0 && d.rating != null ? (
                      <>
                        {d.rating.toFixed(1)}{" "}
                        <span style={{ color: "#94a3b8", fontWeight: 500 }}>({d.reviewCount})</span>
                      </>
                    ) : (
                      <span style={{ color: "#64748b", fontWeight: 500 }}>{t("ratingNew")}</span>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      color: "#94a3b8",
                      fontSize: "11px",
                      fontWeight: 500,
                      flexShrink: 0,
                    }}
                  >
                    {isOfficialRegistry
                      ? "Sağlık Bakanlığı"
                      : isPersonalWebsite
                      ? t("personalWebsiteSourceLabel")
                      : t("unverifiedNotice")}
                  </div>
                )}
              </div>

              {/* Professional Description */}
              {d.bio && (
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#475569",
                    lineHeight: "1.45",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    wordBreak: "break-word",
                  }}
                >
                  {d.bio}
                </p>
              )}

              {/* Footer Actions */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "auto",
                  borderTop: "1px dashed #e2e8f0",
                  paddingTop: "14px",
                  gap: "10px",
                  width: "100%",
                }}
              >
                {isRegistered && internalProfileHref ? (
                  <>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <div
                        title={t("statusOnline")}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: "#f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#475569",
                        }}
                      >
                        <VideoCamera size={16} />
                      </div>
                      <div
                        title={t("sendMessageToDoctor")}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: "#f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#475569",
                        }}
                      >
                        <ChatCircleText size={16} />
                      </div>
                    </div>
                    <Link
                      data-testid="book-appointment-link"
                      href={internalProfileHref}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#0f172a",
                        color: "#fff",
                        padding: "10px 16px",
                        minHeight: "44px",
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontWeight: 600,
                        textDecoration: "none",
                        boxSizing: "border-box",
                      }}
                    >
                      {t("bookAppointment")} <CaretRight size={13} weight="bold" />
                    </Link>
                  </>
                ) : d.navigationMode === "EXTERNAL" && d.primaryHref ? (
                  <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                    <a
                      data-testid="external-website-link"
                      href={d.primaryHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t("externalSiteNotice")}
                      aria-label={`${d.name} - ${t("visitOfficialWebsite")}`}
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        minHeight: "44px",
                        borderRadius: "12px",
                        background: "#ffffff",
                        color: "#0f172a",
                        border: "1px solid #cbd5e1",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        fontWeight: 600,
                        fontSize: "13px",
                        boxSizing: "border-box",
                        transition: "background 0.15s, border-color 0.15s",
                      }}
                      className="hover-bg-slate"
                    >
                      <span>{t("visitOfficialWebsite")}</span>
                      <ArrowSquareOut size={15} weight="bold" />
                    </a>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    {d.phone ? (
                      <a
                        href={`tel:${d.phone}`}
                        style={{
                          color: "#475569",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontWeight: 500,
                          minHeight: "36px",
                        }}
                      >
                        <Phone size={14} /> {d.phone}
                      </a>
                    ) : (
                      <span>{t("externalDirectoryListing")}</span>
                    )}

                    {d.canClaim && (
                      <Link
                        href={claimHref}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          color: "#2563eb",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        {t("claimDoctor")} →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: "48px 24px",
              textAlign: "center",
              background: "#f8fafc",
              borderRadius: "20px",
              color: "#64748b",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <MagnifyingGlass size={42} color="#cbd5e1" weight="duotone" />
            <div>
              <strong style={{ display: "block", color: "#334155", fontSize: "17px", marginBottom: "4px" }}>
                {t("noResultsFoundTitle")}
              </strong>
              <span style={{ fontSize: "14px" }}>
                {t("noResultsFoundDesc")}
              </span>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                style={{
                  marginTop: "8px",
                  padding: "10px 18px",
                  background: "#0f172a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("clearFilters")}
              </button>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .doctor-filter-bar {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
        }
        @media (max-width: 480px) {
          .doctor-cards-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
        }
        .hover-bg-slate:hover {
          background-color: #f8fafc !important;
          border-color: #94a3b8 !important;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
