"use client";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useTranslations } from "next-intl";

type Org = {
  id: string;
  slug: string;
  name: string;
  type: string;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  isOnDuty?: boolean;
  isVerified?: boolean;
  navigationMode?: "INTERNAL" | "EXTERNAL" | "NONE";
  primaryHref?: string | null;
};

const OSM_RASTER_STYLE: mapboxgl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export default function InteractiveOrganizationMap({ rows, token }: { rows: Org[]; token?: string }) {
  const t = useTranslations("organizationMap");
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    const hasUsableMapboxToken = Boolean(token && token.startsWith("pk.") && !isLocalhost);

    if (token) {
      mapboxgl.accessToken = token;
    }

    const located = rows.filter((o) => o.latitude != null && o.longitude != null);
    const center: [number, number] = located.length
      ? [located[0].longitude as number, located[0].latitude as number]
      : [29.0, 41.0];

    let fellBackToOsm = !hasUsableMapboxToken;
    const map = new mapboxgl.Map({
      container: ref.current,
      style: hasUsableMapboxToken ? "mapbox://styles/mapbox/streets-v12" : OSM_RASTER_STYLE,
      center,
      zoom: located.length > 1 ? 10 : 13,
    });

    map.on("error", (ev: any) => {
      const status = ev?.error?.status;
      if (!fellBackToOsm && (status === 401 || status === 403)) {
        fellBackToOsm = true;
        try {
          map.setStyle(OSM_RASTER_STYLE);
        } catch {
          // Ignore style switch race on unmount
        }
      }
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    const bounds = new mapboxgl.LngLatBounds();
    for (const o of located) {
      const lng = o.longitude as number;
      const lat = o.latitude as number;
      bounds.extend([lng, lat]);
      const directions = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      const actionLink =
        o.navigationMode === "INTERNAL" && o.primaryHref
          ? `<a href="${escapeHtml(o.primaryHref)}">${escapeHtml(t("openProfile"))}</a>`
          : o.navigationMode === "EXTERNAL" && o.primaryHref
          ? `<a href="${escapeHtml(o.primaryHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("goToWebsite"))}</a>`
          : "";
      const badge = o.isVerified ? " ✓" : "";
      const popup = new mapboxgl.Popup({ offset: 18 }).setHTML(
        `<div class="alumas-map-popup"><b>${escapeHtml(o.name)}${badge}</b><span>${
          o.isOnDuty ? escapeHtml(t("onDutyPrefix")) : ""
        }${o.distanceKm != null ? o.distanceKm + " km" : ""}</span>${actionLink}<a href="${directions}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("getDirections"))}</a></div>`
      );
      new mapboxgl.Marker({ color: o.isVerified ? "#2563eb" : "#173f34" })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);
    }
    if (located.length > 1) map.fitBounds(bounds, { padding: 60, maxZoom: 13 });
    return () => map.remove();
  }, [rows, token, t]);

  return <div ref={ref} className="interactive-map" aria-label={t("ariaLabel")} />;
}

function escapeHtml(v: string) {
  return v.replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c] || c));
}
