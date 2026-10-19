"use client";
import { useEffect, useState } from "react";
import InteractiveOrganizationMap from "@/components/interactive-organization-map";
import {
  MagnifyingGlass,
  NavigationArrow,
  MapTrifold,
  Buildings,
  Crosshair,
  Pill,
  Prescription,
  FirstAid,
  CaretRight,
  Star,
  ShieldCheck,
  Moon,
  TestTube,
  ArrowSquareOut,
  Globe,
  Clock,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useTranslations } from "next-intl";

type Named = { id: string; name: string };
type Org = {
  id: string;
  directoryId?: string | null;
  organizationId?: string | null;
  slug: string;
  type: "HOSPITAL" | "CLINIC" | "PHARMACY" | "IMAGING_CENTER" | "LABORATORY";
  name: string;
  city: string;
  district?: string | null;
  address: string;
  phone: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  rating?: number | null;
  isOnDuty?: boolean;
  onDutyUntil?: string | null;
  isVerified?: boolean;
  verificationState?: "VERIFIED" | "PENDING_CLAIM" | "UNVERIFIED";
  navigationMode?: "INTERNAL" | "EXTERNAL" | "NONE";
  primaryHref?: string | null;
  isExternalDestination?: boolean;
  officialWebsite?: string | null;
  hasOfficialWebsite?: boolean;
  canClaim?: boolean;
  _count?: { doctors: number; reviews: number };
  services?: Named[];
  imagingExams?: Named[];
  laboratoryTests?: Named[];
};

export default function OrganizationDirectory({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const t = useTranslations("discovery");
  const labels: Record<string, string> = {
    HOSPITAL: t("typeHospital"),
    CLINIC: t("typeClinic"),
    PHARMACY: t("typePharmacy"),
    IMAGING_CENTER: t("typeImaging"),
    LABORATORY: t("typeLab"),
  };
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const [rows, setRows] = useState<Org[]>([]);
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"list" | "map">("list");
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [onDuty, setOnDuty] = useState(false);
  const [geoMsg, setGeoMsg] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(nextPos = pos) {
    setLoading(true);
    const p = new URLSearchParams();
    if (type) p.set("type", type);
    if (q) p.set("q", q);
    if (onDuty) p.set("onDuty", "1");
    if (nextPos) {
      p.set("lat", String(nextPos.lat));
      p.set("lng", String(nextPos.lng));
    }

    try {
      const r = await fetch(`/api/organizations?${p}`);
      setRows(r.ok ? await r.json() : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [type, onDuty]);

  function nearby() {
    if (!isLoggedIn) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (!navigator.geolocation) {
      setGeoMsg(t("geoNotSupported"));
      return;
    }
    setGeoMsg(t("geoLoading"));
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const n = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(n);
        setGeoMsg(t("geoSorted"));
        load(n);
      },
      () => setGeoMsg(t("geoDenied"))
    );
  }

  const getOrgStyling = (orgType: string, isDuty: boolean) => {
    if (isDuty) return { bg: "#fff7ed", text: "#ea580c", icon: <Moon size={24} weight="duotone" /> };
    switch (orgType) {
      case "HOSPITAL":
        return { bg: "#e0f2fe", text: "#0284c7", icon: <Buildings size={24} weight="duotone" /> };
      case "CLINIC":
        return { bg: "#dcfce7", text: "#16a34a", icon: <FirstAid size={24} weight="duotone" /> };
      case "PHARMACY":
        return { bg: "#fef3c7", text: "#d97706", icon: <Pill size={24} weight="duotone" /> };
      case "IMAGING_CENTER":
        return { bg: "#f3e8ff", text: "#9333ea", icon: <Prescription size={24} weight="duotone" /> };
      case "LABORATORY":
        return { bg: "#ccfbf1", text: "#0f766e", icon: <TestTube size={24} weight="duotone" /> };
      default:
        return { bg: "#f1f5f9", text: "#64748b", icon: <Buildings size={24} weight="duotone" /> };
    }
  };

  return (
    <>
      {/* Search & Actions */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
          background: "#fff",
          padding: "16px",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ flex: 1, minWidth: "250px", position: "relative", display: "flex", alignItems: "center" }}>
          <MagnifyingGlass size={20} color="#94a3b8" style={{ position: "absolute", left: "16px" }} />
          <input
            data-testid="organization-search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") load();
            }}
            placeholder={t("searchOrgInputPlaceholder")}
            style={{
              width: "100%",
              padding: "14px 16px 14px 44px",
              borderRadius: "16px",
              border: "1px solid #cbd5e1",
              background: "#f8fafc",
              outline: "none",
              fontSize: "15px",
            }}
          />
        </div>
        <button
          data-testid="organization-search-button"
          onClick={() => load()}
          style={{
            padding: "0 24px",
            background: "#0f172a",
            color: "#fff",
            borderRadius: "16px",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          {t("searchButton")}
        </button>
        <button
          data-testid="organization-nearby-button"
          onClick={nearby}
          style={{
            padding: "0 20px",
            background: "#f8fafc",
            color: "#0f172a",
            borderRadius: "16px",
            border: "1px solid #cbd5e1",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Crosshair size={20} weight="bold" /> {t("nearbyButton")}
        </button>
        <button
          data-testid="organization-map-toggle-button"
          onClick={() => setView(view === "list" ? "map" : "list")}
          style={{
            padding: "0 20px",
            background: "#f8fafc",
            color: "#0f172a",
            borderRadius: "16px",
            border: "1px solid #cbd5e1",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <MapTrifold size={20} weight="bold" /> {view === "list" ? t("viewOnMap") : t("backToList")}
        </button>
      </div>

      {geoMsg && (
        <div
          style={{
            marginBottom: "24px",
            padding: "12px 16px",
            background: "#e0f2fe",
            color: "#0284c7",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          {geoMsg}
        </div>
      )}

      {/* Filter Pills */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "32px", overflowX: "auto", paddingBottom: "8px" }}>
        {[
          { id: "", label: t("typeAll") },
          { id: "HOSPITAL", label: t("typeHospital") },
          { id: "CLINIC", label: t("typeClinic") },
          { id: "PHARMACY", label: t("typePharmacy") },
          { id: "IMAGING_CENTER", label: t("typeImaging") },
          { id: "LABORATORY", label: t("typeLab") },
        ].map((x) => {
          const isSelected = type === x.id && !onDuty;
          return (
            <button
              key={x.id}
              data-testid={`filter-type-${x.id ? x.id.toLowerCase() : "all"}`}
              onClick={() => {
                setOnDuty(false);
                setType(x.id);
              }}
              style={{
                padding: "10px 20px",
                borderRadius: "100px",
                border: isSelected ? "none" : "1px solid #cbd5e1",
                background: isSelected ? "#0f172a" : "#f8fafc",
                color: isSelected ? "#fff" : "#475569",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
            >
              {x.label}
            </button>
          );
        })}
        <button
          data-testid="filter-type-on-duty"
          onClick={() => {
            setType("PHARMACY");
            setOnDuty(true);
          }}
          style={{
            padding: "10px 20px",
            borderRadius: "100px",
            border: onDuty ? "none" : "1px solid #fed7aa",
            background: onDuty ? "#ea580c" : "#fff7ed",
            color: onDuty ? "#fff" : "#ea580c",
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s",
          }}
        >
          <Moon size={18} weight="fill" /> {t("onDutyPharmacy")}
        </button>
      </div>

      {view === "list" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "24px",
            marginBottom: "48px",
          }}
        >
          {rows.map((o) => {
            const isVerified = o.isVerified === true;
            const navMode = o.navigationMode || (isVerified ? "INTERNAL" : o.officialWebsite ? "EXTERNAL" : "NONE");
            const primaryHref = o.primaryHref ?? (isVerified ? `/organizations/${o.slug}` : o.officialWebsite || null);
            const style = getOrgStyling(o.type, !!o.isOnDuty && o.type === "PHARMACY");
            const preview =
              (o.type === "IMAGING_CENTER"
                ? o.imagingExams
                : o.type === "LABORATORY"
                ? o.laboratoryTests
                : o.type === "PHARMACY"
                ? []
                : o.services
              )
                ?.map((item) => item.name)
                .slice(0, 3) || [];

            return (
              <div
                key={o.id}
                data-testid={`directory-card-${o.slug}`}
                style={{
                  background: "#fff",
                  borderRadius: "24px",
                  border: isVerified ? "1px solid #dbeafe" : "1px solid #e2e8f0",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
                }}
                className="hover-shadow"
              >
                <div style={{ padding: "24px", display: "flex", gap: "16px", borderBottom: "1px solid #f1f5f9" }}>
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "20px",
                      background: style.bg,
                      color: style.text,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {style.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          color: style.text,
                        }}
                      >
                        {labels[o.type]}
                      </span>
                      {o.type === "PHARMACY" && o.isOnDuty && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            background: "#ea580c",
                            color: "#fff",
                            borderRadius: "100px",
                          }}
                        >
                          {t("onDutyBadge")}
                        </span>
                      )}
                    </div>
                    <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: 700, lineHeight: "1.4" }}>
                      {navMode === "INTERNAL" && primaryHref ? (
                        <Link href={primaryHref} style={{ color: "inherit", textDecoration: "none" }}>
                          {o.name}
                        </Link>
                      ) : navMode === "EXTERNAL" && primaryHref ? (
                        <a
                          href={primaryHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t("externalSiteNotice")}
                          style={{ color: "inherit", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          <span>{o.name}</span>
                          <ArrowSquareOut size={16} color="#64748b" />
                        </a>
                      ) : (
                        <span>{o.name}</span>
                      )}
                    </h3>
                  </div>
                </div>

                <div
                  style={{
                    padding: "20px 24px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ fontSize: "14px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                    <NavigationArrow size={16} /> {o.city}
                    {o.district ? `, ${o.district}` : ""}{" "}
                    {o.distanceKm != null ? `• ${o.distanceKm.toFixed(1)} km` : ""}
                  </div>
                  <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>{o.address}</p>
                  {preview.length > 0 && (
                    <div style={{ fontSize: "13px", color: "#334155", lineHeight: "1.45" }}>{preview.join(" · ")}</div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      marginTop: "auto",
                      paddingTop: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      {isVerified ? (
                        <div
                          data-testid="alumas-verified-badge"
                          title={t("alumasVerifiedTooltip")}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#2563eb",
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            padding: "4px 10px",
                            borderRadius: "100px",
                          }}
                        >
                          <ShieldCheck size={16} weight="fill" color="#2563eb" /> {t("alumasVerified")}
                        </div>
                      ) : o.verificationState === "PENDING_CLAIM" ? (
                        <div
                          data-testid="pending-claim-badge"
                          title={t("claimPendingTooltip")}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#b45309",
                            background: "#fffbeb",
                            border: "1px solid #fde68a",
                            padding: "4px 10px",
                            borderRadius: "100px",
                          }}
                        >
                          <Clock size={15} weight="duotone" /> {t("claimPendingBadge")}
                        </div>
                      ) : (
                        <div
                          data-testid="external-directory-badge"
                          title={t("externalDirectoryTooltip")}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#475569",
                            background: "#f1f5f9",
                            padding: "4px 10px",
                            borderRadius: "100px",
                          }}
                        >
                          <Globe size={15} weight="duotone" /> {t("externalDirectoryListing")}
                        </div>
                      )}

                      {isVerified && o.rating != null && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#f59e0b",
                          }}
                        >
                          <Star size={16} weight="fill" /> {o.rating.toFixed(1)} ({o._count?.reviews || 0})
                        </div>
                      )}
                    </div>

                    {!isVerified && o.canClaim && (
                      <Link
                        data-testid="claim-institution-link"
                        href={`/business/apply?claimDirectoryId=${encodeURIComponent(o.directoryId || o.id)}`}
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#0284c7",
                          textDecoration: "none",
                        }}
                      >
                        {t("claimInstitution")} →
                      </Link>
                    )}
                  </div>
                </div>

                {(o.latitude != null || primaryHref) && (
                  <div
                    style={{
                      padding: "16px 24px",
                      background: "#fff",
                      borderTop: "1px solid #f1f5f9",
                      display: "flex",
                      gap: "12px",
                    }}
                  >
                    {o.latitude != null && o.longitude != null && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${o.latitude},${o.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1,
                          padding: "12px",
                          borderRadius: "12px",
                          border: "1px solid #cbd5e1",
                          background: "#f8fafc",
                          color: "#0f172a",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          fontWeight: 600,
                          fontSize: "14px",
                        }}
                      >
                        {t("directions")} <NavigationArrow size={16} weight="bold" />
                      </a>
                    )}

                    {navMode === "INTERNAL" && primaryHref ? (
                      <Link
                        data-testid="internal-profile-link"
                        href={primaryHref}
                        style={{
                          flex: 1,
                          padding: "12px",
                          borderRadius: "12px",
                          background: "#0f172a",
                          color: "#fff",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          fontWeight: 600,
                          fontSize: "14px",
                        }}
                      >
                        {t("inspect")} <CaretRight size={16} weight="bold" />
                      </Link>
                    ) : navMode === "EXTERNAL" && primaryHref ? (
                      <a
                        data-testid="external-website-link"
                        href={primaryHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t("externalSiteNotice")}
                        aria-label={`${o.name} - ${t("visitOfficialWebsite")} (${t("externalSiteNotice")})`}
                        style={{
                          flex: 1,
                          padding: "12px",
                          borderRadius: "12px",
                          background: "#ffffff",
                          color: "#0f172a",
                          border: "1px solid #0f172a",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          fontWeight: 600,
                          fontSize: "14px",
                        }}
                      >
                        {t("visitOfficialWebsite")} <ArrowSquareOut size={16} weight="bold" />
                      </a>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
          {!loading && rows.length === 0 && (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "64px",
                textAlign: "center",
                background: "#f8fafc",
                borderRadius: "24px",
                border: "1px dashed #cbd5e1",
                color: "#64748b",
              }}
            >
              {t("noOrgFound")}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            height: "600px",
            borderRadius: "24px",
            overflow: "hidden",
            border: "1px solid #e2e8f0",
            marginBottom: "48px",
          }}
        >
          <InteractiveOrganizationMap rows={rows} token={token} />
        </div>
      )}
    </>
  );
}
