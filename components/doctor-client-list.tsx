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
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import type { NormalizedExpertItem } from "@/lib/expert-directory";

export default function DoctorClientList({
  doctors,
  profileId,
}: {
  doctors: NormalizedExpertItem[];
  profileId?: string;
}) {
  const t = useTranslations("discovery");
  const [search, setSearch] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [filterCity, setFilterCity] = useState("");

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

  const specialties = useMemo(() => {
    const s = new Set(doctors.map((d) => d.specialty));
    return Array.from(s).filter(Boolean).sort();
  }, [doctors]);

  const cities = useMemo(() => {
    const c = new Set(doctors.map((d) => d.city));
    return Array.from(c).filter(Boolean).sort();
  }, [doctors]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return doctors.filter((d) => {
      const matchSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        (d.title && d.title.toLowerCase().includes(q)) ||
        d.specialty.toLowerCase().includes(q) ||
        (d.hospital && d.hospital.toLowerCase().includes(q)) ||
        d.city.toLowerCase().includes(q);

      const matchSpecialty = filterSpecialty ? d.specialty === filterSpecialty : true;
      const matchCity = filterCity ? d.city === filterCity : true;

      return matchSearch && matchSpecialty && matchCity;
    });
  }, [doctors, search, filterSpecialty, filterCity]);

  return (
    <>
      <div style={{ display: "flex", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 300px", position: "relative" }}>
          <MagnifyingGlass
            size={20}
            color="#64748b"
            style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchDoctorPlaceholder")}
            style={{
              width: "100%",
              padding: "16px 16px 16px 48px",
              borderRadius: "16px",
              border: "1px solid #cbd5e1",
              fontSize: "15px",
              outline: "none",
              transition: "all 0.2s",
              background: "#fff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
          />
        </div>

        <div style={{ flex: "0 0 auto", position: "relative" }}>
          <Funnel
            size={18}
            color="#64748b"
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <select
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            style={{
              appearance: "none",
              padding: "16px 40px 16px 42px",
              borderRadius: "16px",
              border: "1px solid #cbd5e1",
              fontSize: "15px",
              outline: "none",
              background: "#fff",
              color: filterSpecialty ? "#0f172a" : "#64748b",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            }}
          >
            <option value="">{t("allSpecialties")}</option>
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {cities.length > 1 && (
          <div style={{ flex: "0 0 auto", position: "relative" }}>
            <MapPin
              size={18}
              color="#64748b"
              style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              style={{
                appearance: "none",
                padding: "16px 40px 16px 42px",
                borderRadius: "16px",
                border: "1px solid #cbd5e1",
                fontSize: "15px",
                outline: "none",
                background: "#fff",
                color: filterCity ? "#0f172a" : "#64748b",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
              }}
            >
              <option value="">{t("allCities", { default: "Tüm Şehirler" })}</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "24px",
          marginBottom: "48px",
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

          return (
            <div
              key={d.id}
              data-testid={`directory-card-${d.slug}`}
              style={{
                background: "#fff",
                borderRadius: "24px",
                padding: "24px",
                border: isVerified ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                textDecoration: "none",
                color: "inherit",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
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
                        color: "#2563eb",
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
                  ) : !isRegistered ? (
                    <div
                      data-testid="external-directory-badge"
                      title={d.isOfficialSource ? t("externalDoctorNotice") : t("externalDirectoryListing")}
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
                      <Globe size={14} weight="duotone" /> {d.isOfficialSource ? t("externalDoctorNotice") : t("externalDirectoryListing")}
                    </div>
                  ) : null}
                </div>

                {!isVerified && d.canClaim && (
                  <Link
                    data-testid="claim-doctor-link"
                    href={claimHref}
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#2563eb",
                      textDecoration: "none",
                      padding: "3px 8px",
                      borderRadius: "8px",
                      background: "#eff6ff",
                      transition: "all 0.15s",
                    }}
                  >
                    {t("claimDoctor")}
                  </Link>
                )}
              </div>

              {/* Profil Bilgisi */}
              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "18px",
                      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "19px",
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
                        width: "15px",
                        height: "15px",
                        background: presence.dot,
                        borderRadius: "50%",
                        border: "3px solid #fff",
                      }}
                    />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "17px",
                      color: "#0f172a",
                      fontWeight: 700,
                      lineHeight: "1.35",
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
                        }}
                      >
                        <span>
                          {d.title ? `${d.title} ` : ""}
                          {d.name}
                        </span>
                        <ArrowSquareOut size={15} color="#64748b" />
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
                      color: "#4f46e5",
                      fontSize: "13px",
                      fontWeight: 600,
                      marginTop: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Stethoscope size={15} /> {d.specialty}
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
                      <Buildings size={14} /> {d.hospital}
                    </div>
                  )}
                </div>
              </div>

              {/* Lokasyon ve Puan / Kaynak */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  background: "#f8fafc",
                  padding: "10px 14px",
                  borderRadius: "14px",
                  fontSize: "13px",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  <MapPin size={15} /> {d.city}
                  {d.district ? `, ${d.district}` : ""}
                </div>

                {isRegistered ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      color: "#f59e0b",
                      fontWeight: 700,
                    }}
                  >
                    <Star size={15} weight="fill" />
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
                  <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 500 }}>
                    {d.source === "MINISTRY_OF_HEALTH"
                      ? "T.C. Sağlık Bakanlığı"
                      : "Resmî Dizin"}
                  </div>
                )}
              </div>

              {/* Bio (varsa) */}
              {d.bio && (
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#475569",
                    lineHeight: "1.45",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {d.bio}
                </p>
              )}

              {/* Footer Aksiyonlar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "auto",
                  borderTop: "1px dashed #e2e8f0",
                  paddingTop: "16px",
                  gap: "10px",
                }}
              >
                {isRegistered && internalProfileHref ? (
                  <>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
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
                        style={{
                          width: "34px",
                          height: "34px",
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
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontWeight: 600,
                        textDecoration: "none",
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
                      aria-label={`${d.name} - ${t("visitOfficialWebsite")} (${t("externalSiteNotice")})`}
                      style={{
                        flex: 1,
                        padding: "10px 14px",
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
                      }}
                    >
                      {t("visitOfficialWebsite")} <ArrowSquareOut size={15} weight="bold" />
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
                        }}
                      >
                        <Phone size={14} /> {d.phone}
                      </a>
                    ) : (
                      <span>{d.isOfficialSource ? t("externalDoctorNotice") : t("externalDirectoryListing")}</span>
                    )}

                    {d.canClaim && (
                      <Link
                        href={claimHref}
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
              padding: "64px",
              textAlign: "center",
              background: "#f8fafc",
              borderRadius: "24px",
              color: "#64748b",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <MagnifyingGlass size={48} color="#cbd5e1" weight="duotone" />
            <div>
              <strong style={{ display: "block", color: "#334155", fontSize: "18px", marginBottom: "4px" }}>
                {t("noResultsFoundTitle")}
              </strong>
              {t("noResultsFoundDesc")}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
