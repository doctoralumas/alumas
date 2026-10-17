"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Crosshair,
  MapPin,
  NavigationArrow,
  Star,
  MapTrifold,
  Buildings,
  FirstAid,
  Pill,
  Prescription,
  Stethoscope,
  Ambulance,
  Bed,
  Info,
  MagnifyingGlass,
} from "@phosphor-icons/react";

type Place = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number | null;
  userRatingCount?: number | null;
  mapsUrl?: string | null;
  openNow?: boolean | null;
  distanceKm?: number | null;
  typeLabel?: string | null;
};

const CATEGORY_KEYS = [
  "health",
  "hospital",
  "clinic",
  "pharmacy",
  "imaging",
  "doctor",
  "emergency",
  "hotel",
] as const;

type CategoryKey = (typeof CATEGORY_KEYS)[number];

type NearbyStatus =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "cached"; count: number }
  | { type: "found"; count: number }
  | { type: "error"; message?: string }
  | { type: "geo_locating" }
  | { type: "geo_denied" }
  | { type: "geo_unsupported" }
  | { type: "api_key_missing" };

export default function GoogleNearbyPlaces({
  initial = "health",
  isLoggedIn,
}: {
  initial?: string;
  isLoggedIn: boolean;
}) {
  const t = useTranslations("search.nearby.component");

  if (!isLoggedIn) {
    return (
      <div
        style={{
          padding: "64px 20px",
          textAlign: "center",
          background: "#f8fafc",
          borderRadius: "24px",
          border: "1px dashed #cbd5e1",
          marginTop: "24px",
        }}
      >
        <MapPin size={48} color="#94a3b8" style={{ marginBottom: "16px" }} />
        <h2 style={{ fontSize: "24px", color: "#0f172a", marginBottom: "8px" }}>
          {t("notLoggedInTitle")}
        </h2>
        <p
          style={{
            color: "#64748b",
            marginBottom: "32px",
            maxWidth: "500px",
            margin: "0 auto 32px",
            fontSize: "16px",
            lineHeight: 1.6,
          }}
        >
          {t("notLoggedInDesc")}
        </p>
        <a
          href="/login?next=/nearby"
          style={{
            display: "inline-flex",
            background: "#0f172a",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: "100px",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "16px",
          }}
        >
          {t("loginRegister")}
        </a>
      </div>
    );
  }

  const initialCat = (CATEGORY_KEYS.includes(initial as CategoryKey) ? initial : "health") as CategoryKey;
  const [category, setCategory] = useState<CategoryKey>(initialCat);
  const [ownership, setOwnership] = useState<"all" | "private" | "public">("all");
  const [rows, setRows] = useState<Place[]>([]);
  const [status, setStatus] = useState<NearbyStatus>({ type: "idle" });

  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [showSearchHere, setShowSearchHere] = useState(false);

  const [loading, setLoading] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    try {
      const savedPos = sessionStorage.getItem("alumas_nearby_pos");
      if (savedPos) {
        const p = JSON.parse(savedPos);
        setPos(p);
        setSearchCenter(p);
      }
    } catch (e) {}
  }, []);

  async function load(
    p: { lat: number; lng: number } | null = searchCenter || pos,
    c = category,
    o = ownership
  ) {
    if (!p) return;
    setLoading(true);
    setStatus({ type: "loading" });
    setShowSearchHere(false);

    setSearchCenter(p);

    const cacheKey = `alumas_places_${p.lat.toFixed(3)}_${p.lng.toFixed(3)}_${c}_${o}`;

    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setRows(parsed);
        setStatus({ type: "cached", count: parsed.length });
        setLoading(false);
        return;
      }
    } catch (e) {}

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setStatus({ type: "api_key_missing" });
    }

    try {
      const r = await fetch(
        `/api/places/nearby?lat=${p.lat}&lng=${p.lng}&category=${c}&radius=8000${
          o !== "all" ? "&ownership=" + o : ""
        }`
      );
      const j = await r.json();
      if (!r.ok) {
        setStatus({ type: "error", message: j.error });
        setRows([]);
        return;
      }

      const newRows = j.rows || [];
      setRows(newRows);
      setStatus({ type: "found", count: newRows.length });
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(newRows));
      } catch (e) {}
    } catch (err) {
      setStatus({ type: "error" });
    } finally {
      setLoading(false);
    }
  }

  function locate() {
    if (!navigator.geolocation) {
      setStatus({ type: "geo_unsupported" });
      return;
    }
    setStatus({ type: "geo_locating" });
    navigator.geolocation.getCurrentPosition(
      (x) => {
        const p = { lat: x.coords.latitude, lng: x.coords.longitude };
        try {
          sessionStorage.setItem("alumas_nearby_pos", JSON.stringify(p));
        } catch (e) {}
        setPos(p);
        setSearchCenter(p);
        if (mapInstance.current) {
          mapInstance.current.setCenter(p);
          mapInstance.current.setZoom(14);
        }
      },
      () => setStatus({ type: "geo_denied" }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  useEffect(() => {
    if (searchCenter || pos) load(searchCenter || pos, category, ownership);
  }, [category, ownership]);

  useEffect(() => {
    if (searchCenter && rows.length === 0 && !loading) {
      load(searchCenter, category, ownership);
    }
  }, [searchCenter]);

  // Google Maps Initialization & Marker Management
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || !mapRef.current || (!pos && !searchCenter)) return;
    const id = "alumas-google-maps";

    function initOrUpdateMap() {
      const g = (window as any).google;
      if (!g || !mapRef.current || !g.maps?.Map) return;

      if (!mapInstance.current) {
        mapInstance.current = new g.maps.Map(mapRef.current, {
          center: searchCenter || pos,
          zoom: 14,
          mapId: "ALUMAS_MAP_ID",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        mapInstance.current.addListener("dragend", () => {
          setShowSearchHere(true);
        });
      }

      markersRef.current.forEach((m) => {
        if (m) m.map = null;
      });
      markersRef.current = [];

      const map = mapInstance.current;

      if (pos) {
        const userMarker = new g.maps.marker.AdvancedMarkerElement({
          map,
          position: pos,
          title: t("yourLocation"),
        });
        markersRef.current.push(userMarker);
      }

      const directionsLabel = t("getDirections");
      rows.forEach((x) => {
        const m = new g.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: x.latitude, lng: x.longitude },
          title: x.name,
        });
        const info = new g.maps.InfoWindow({
          content: `<div style="padding:4px"><b>${x.name.replace(
            /[<>]/g,
            ""
          )}</b><br/><span style="color:#64748b;font-size:12px">${x.address.replace(
            /[<>]/g,
            ""
          )}</span>${
            x.mapsUrl
              ? `<br/><br/><a href="${x.mapsUrl}" target="_blank" rel="noreferrer" style="color:#0f172a;font-weight:600;text-decoration:none">${directionsLabel}</a>`
              : ""
          }</div>`,
        });
        m.addEventListener("gmp-click", () => info.open({ anchor: m, map }));
        markersRef.current.push(m);
      });
    }

    if ((window as any).google?.maps?.Map) {
      initOrUpdateMap();
      return;
    }

    const prev = (window as any).alumasMapCallback;
    (window as any).alumasMapCallback = () => {
      if (typeof prev === "function") prev();
      initOrUpdateMap();
    };

    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        key
      )}&v=weekly&libraries=marker&loading=async&callback=alumasMapCallback`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, [rows, pos, searchCenter, t]);

  const handleSearchHere = () => {
    if (!mapInstance.current) return;
    const center = mapInstance.current.getCenter();
    load({ lat: center.lat(), lng: center.lng() }, category, ownership);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "hospital":
        return <Buildings size={24} weight="duotone" />;
      case "clinic":
        return <FirstAid size={24} weight="duotone" />;
      case "pharmacy":
        return <Pill size={24} weight="duotone" />;
      case "imaging":
        return <Prescription size={24} weight="duotone" />;
      case "doctor":
        return <Stethoscope size={24} weight="duotone" />;
      case "emergency":
        return <Ambulance size={24} weight="duotone" />;
      case "hotel":
        return <Bed size={24} weight="duotone" />;
      default:
        return <MapPin size={24} weight="duotone" />;
    }
  };

  const statusText = (() => {
    switch (status.type) {
      case "loading":
        return t("loading");
      case "cached":
        return t("cachedResults", { count: status.count });
      case "found":
        return t("resultsFound", { count: status.count });
      case "geo_locating":
        return t("geoLocating");
      case "geo_denied":
        return t("geoDenied");
      case "geo_unsupported":
        return t("geoNotSupported");
      case "api_key_missing":
        return t("apiKeyRequired");
      case "error":
        return status.message || t("connectionError");
      case "idle":
      default:
        return t("initialPrompt");
    }
  })();

  return (
    <>
      {/* Category Pills */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "16px",
          overflowX: "auto",
          paddingBottom: "8px",
        }}
      >
        {CATEGORY_KEYS.map((k) => (
          <button
            key={k}
            onClick={() => {
              setCategory(k);
              if (!["health", "hospital", "emergency", "clinic"].includes(k)) {
                setOwnership("all");
              }
            }}
            style={{
              padding: "10px 20px",
              borderRadius: "100px",
              border: category === k ? "none" : "1px solid #cbd5e1",
              background: category === k ? "#0f172a" : "#fff",
              color: category === k ? "#fff" : "#475569",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
          >
            {t(`categories.${k}`)}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {/* Left Side: Locate Button + Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={locate}
            style={{
              padding: "10px 20px",
              background: "#0f172a",
              color: "#fff",
              borderRadius: "100px",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
          >
            <Crosshair size={18} weight="bold" /> {pos ? t("goToMyLocation") : t("findLocation")}
          </button>
          <span style={{ fontSize: "14px", color: "#64748b", fontWeight: 500 }}>
            {statusText}
          </span>
        </div>

        {/* Right Side: Ownership Pills */}
        <div style={{ minHeight: "40px", display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              gap: "8px",
              opacity: ["health", "hospital", "emergency", "clinic"].includes(category) ? 1 : 0,
              pointerEvents: ["health", "hospital", "emergency", "clinic"].includes(category)
                ? "auto"
                : "none",
              transition: "opacity 0.2s",
            }}
          >
            <button
              onClick={() => setOwnership("all")}
              style={{
                padding: "8px 16px",
                borderRadius: "100px",
                border: "1px solid",
                borderColor: ownership === "all" ? "#0ea5e9" : "#e2e8f0",
                background: ownership === "all" ? "#e0f2fe" : "#fff",
                color: ownership === "all" ? "#0369a1" : "#64748b",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              {t("ownership.all")}
            </button>
            <button
              onClick={() => setOwnership("private")}
              style={{
                padding: "8px 16px",
                borderRadius: "100px",
                border: "1px solid",
                borderColor: ownership === "private" ? "#8b5cf6" : "#e2e8f0",
                background: ownership === "private" ? "#ede9fe" : "#fff",
                color: ownership === "private" ? "#6d28d9" : "#64748b",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              {t("ownership.private")}
            </button>
            <button
              onClick={() => setOwnership("public")}
              style={{
                padding: "8px 16px",
                borderRadius: "100px",
                border: "1px solid",
                borderColor: ownership === "public" ? "#10b981" : "#e2e8f0",
                background: ownership === "public" ? "#d1fae5" : "#fff",
                color: ownership === "public" ? "#047857" : "#64748b",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              {t("ownership.public")}
            </button>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: "32px" }}>
        {showSearchHere && (
          <div
            style={{
              position: "absolute",
              top: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              pointerEvents: "auto",
            }}
          >
            <button
              onClick={handleSearchHere}
              style={{
                background: "#fff",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                padding: "10px 20px",
                borderRadius: "100px",
                fontWeight: 700,
                fontSize: "14px",
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
            >
              <MagnifyingGlass size={18} weight="bold" /> {t("searchThisArea")}
            </button>
          </div>
        )}

        <div
          ref={mapRef}
          style={{
            height: "400px",
            borderRadius: "24px",
            background: "#f1f5f9",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!pos && (
            <div
              style={{
                color: "#94a3b8",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <MapTrifold size={48} weight="duotone" /> {t("mapPermissionPrompt")}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "24px",
          marginBottom: "48px",
        }}
      >
        {rows.map((x) => (
          <div
            key={x.id}
            style={{
              background: "#fff",
              borderRadius: "24px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            }}
            className="hover-shadow"
          >
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "#f8fafc",
                  color: "#0f172a",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {getCategoryIcon(category)}
              </div>
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "#64748b",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  {x.typeLabel || t(`categories.${category}`)}
                </span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "17px",
                    color: "#0f172a",
                    fontWeight: 700,
                    lineHeight: "1.3",
                  }}
                >
                  {x.name}
                </h3>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>
                {x.address}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
                padding: "12px",
                background: "#f8fafc",
                borderRadius: "12px",
              }}
            >
              {x.distanceKm != null && (
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                  {x.distanceKm.toFixed(1)} km
                </div>
              )}
              {x.rating != null && (
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
                  <Star size={16} weight="fill" /> {x.rating.toFixed(1)} (
                  {x.userRatingCount || 0})
                </div>
              )}
              {x.openNow === true && (
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#16a34a" }}>
                  {t("openNow")}
                </div>
              )}
              {x.openNow === false && (
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#dc2626" }}>
                  {t("closedNow")}
                </div>
              )}
            </div>

            {x.mapsUrl && (
              <a
                href={x.mapsUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  width: "100%",
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
                {t("openInGoogleMaps")} <NavigationArrow size={16} weight="bold" />
              </a>
            )}
          </div>
        ))}
      </div>

      {rows.length > 0 && (
        <div
          style={{
            padding: "16px",
            background: "#f8fafc",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          <Info size={20} weight="duotone" /> {t("disclaimer")}
        </div>
      )}
    </>
  );
}