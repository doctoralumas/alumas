import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import {
  normalizeTextKey,
  queryNormalizedDirectory,
} from "@/lib/institution-directory";
import {
  filterAndRankByInsuranceDiscovery,
  type InsuranceDiscoveryEligibilityState,
} from "@/lib/insurance-domain";

const categories: any = {
  hospital: { types: ["hospital", "general_hospital", "medical_center"], alumasType: "HOSPITAL" },
  clinic: { types: ["medical_clinic", "medical_center", "dental_clinic"], alumasType: "CLINIC" },
  pharmacy: { types: ["pharmacy", "drugstore"], alumasType: "PHARMACY" },
  imaging: { text: "görüntüleme merkezi MR röntgen", alumasType: "IMAGING_CENTER" },
  doctor: { types: ["doctor"], alumasType: null },
  hotel: { types: ["hotel", "lodging", "resort_hotel", "hostel"], alumasType: null },
  health: { types: ["hospital", "medical_center", "medical_clinic", "medical_lab", "doctor"], alumasType: "" },
  emergency: { text: "acil servis hastane", types: ["hospital"], alumasType: "HOSPITAL" },
};

function distance(a: number, b: number, c: number, d: number) {
  const R = 6371;
  const p = (x: number) => (x * Math.PI) / 180;
  const z = Math.sin(p(c - a) / 2) ** 2 + Math.cos(p(a)) * Math.cos(p(c)) * Math.sin(p(d - b) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(z));
}

function normalize(
  x: any,
  lat: number,
  lng: number,
  activeInsurer: { id: string; slug?: string | null; name?: string | null } | null
) {
  const la = Number(x.location?.latitude);
  const lo = Number(x.location?.longitude);
  return {
    id: x.id,
    name: x.displayName?.text || "İsimsiz yer",
    address: x.formattedAddress || "",
    latitude: la,
    longitude: lo,
    rating: x.rating ?? null,
    userRatingCount: x.userRatingCount ?? null,
    phone: x.nationalPhoneNumber ?? null,
    website: x.websiteUri ?? null,
    mapsUrl: x.googleMapsUri ?? null,
    openNow: x.regularOpeningHours?.openNow ?? null,
    primaryType: x.primaryType ?? null,
    typeLabel: x.primaryTypeDisplayName?.text || x.googleMapsTypeLabel?.text || null,
    distanceKm: Number.isFinite(la) && Number.isFinite(lo) ? Number(distance(lat, lng, la, lo).toFixed(2)) : null,
    source: "google_places",
    isVerified: false,
    primaryHref: null,
    // External Google Places results NEVER get labeled as insurance-compatible without verified agreement data
    insuranceMatch: activeInsurer
      ? {
          matched: false,
          confirmed: false,
          matchTier: "NO_MATCH" as const,
          eligibilityState: "UNKNOWN" as InsuranceDiscoveryEligibilityState,
          matchedAgreementIds: [] as string[],
          note: null,
          reasonCode: "EXTERNAL_GOOGLE_PLACE_UNVERIFIED",
          insuranceProviderId: activeInsurer.id,
          insurerName: activeInsurer.name || null,
          insurerSlug: activeInsurer.slug || null,
        }
      : null,
  };
}

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const u = new URL(req.url);
  const lat = Number(u.searchParams.get("lat"));
  const lng = Number(u.searchParams.get("lng"));
  const category = u.searchParams.get("category") || "health";
  const ownership = u.searchParams.get("ownership"); // 'private' or 'public'
  const radius = Math.min(50000, Math.max(100, Number(u.searchParams.get("radius") || 5000)));
  const radiusKm = Math.max(15, radius / 1000);

  const insuranceProviderId = u.searchParams.get("insuranceProviderId") || null;
  const insuranceSlug = u.searchParams.get("insuranceSlug") || null;
  const productType = u.searchParams.get("productType") || null;
  const productId = u.searchParams.get("productId") || null;
  const networkId = u.searchParams.get("networkId") || null;
  const strictConfirmedOnly = u.searchParams.get("strictConfirmedOnly") === "1";
  const prioritizeInNetwork =
    u.searchParams.get("prioritizeInNetwork") !== "0" &&
    Boolean(insuranceProviderId || insuranceSlug);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ error: "lat/lng gerekli" }, { status: 400 });

  const cfg = categories[category];
  if (!cfg) return NextResponse.json({ error: "Geçersiz kategori" }, { status: 400 });

  const activeInsurer =
    insuranceProviderId || insuranceSlug
      ? {
          id: insuranceProviderId || insuranceSlug || "",
          slug: insuranceSlug || insuranceProviderId,
          name: null,
        }
      : null;

  // 1. Load ALUMAS Healthcare Facilities (strictly excluding INSURANCE_COMPANY) for physical facility categories
  let alumasRows: any[] = [];
  if (cfg.alumasType !== null) {
    try {
      const dirItems = await queryNormalizedDirectory({
        type: cfg.alumasType || null,
        lat,
        lng,
        excludeInsuranceCompanies: true,
        insuranceProviderId,
        insuranceSlug,
        productType,
        productId,
        networkId,
      });

      alumasRows = dirItems
        .filter(
          (item) =>
            item.type !== "INSURANCE_COMPANY" &&
            item.latitude != null &&
            item.longitude != null &&
            (item.distanceKm == null || item.distanceKm <= radiusKm)
        )
        .map((item) => ({
          id: item.id,
          directoryId: item.directoryId,
          organizationId: item.organizationId,
          slug: item.slug,
          name: item.name,
          address: item.address,
          latitude: item.latitude!,
          longitude: item.longitude!,
          rating: item.rating,
          userRatingCount: item._count?.reviews ?? null,
          phone: item.phone || null,
          website: item.officialWebsite || null,
          mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`,
          openNow: item.isOnDuty ? true : null,
          primaryType: item.type,
          typeLabel: null,
          distanceKm: item.distanceKm,
          source: item.isVerified ? "alumas_verified" : "alumas_directory",
          isVerified: item.isVerified,
          verificationState: item.verificationState,
          primaryHref: item.primaryHref,
          insuranceMatch: item.insuranceMatch || null,
        }));
    } catch {
      alumasRows = [];
    }
  }

  // 2. Query external Google Places when API key is configured
  const key = process.env.GOOGLE_PLACES_API_KEY;
  let googleRows: any[] = [];

  if (key) {
    const headers: any = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.googleMapsUri,places.nationalPhoneNumber,places.websiteUri,places.regularOpeningHours,places.primaryType,places.primaryTypeDisplayName,places.googleMapsTypeLabel",
    };

    let endpoint = "https://places.googleapis.com/v1/places:searchNearby";
    let body: any = {
      includedTypes: cfg.types,
      maxResultCount: 20,
      rankPreference: "DISTANCE",
      languageCode: "tr",
      locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius } },
    };

    let textQuery = cfg.text || "";

    if (ownership === "private") {
      textQuery = category === "emergency" ? "Özel Hastane Acil Servis" : textQuery ? "Özel " + textQuery : "Özel Hastane " + category;
    } else if (ownership === "public") {
      textQuery = category === "emergency" ? "Devlet Hastanesi Acil Servis" : textQuery ? "Devlet Hastanesi " + textQuery : "Devlet Hastanesi " + category;
    }

    if (textQuery) {
      endpoint = "https://places.googleapis.com/v1/places:searchText";
      body = {
        textQuery: textQuery,
        languageCode: "tr",
        maxResultCount: 20,
        locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius } },
      };
      if (cfg.types) {
        body.includedType = cfg.types[0];
      } else if (category === "emergency") {
        body.includedType = "hospital";
      }
    }

    try {
      const r = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body), cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        googleRows = (j.places || []).map((x: any) => normalize(x, lat, lng, activeInsurer));
      } else if (alumasRows.length === 0) {
        const text = await r.text();
        console.error("Google Places", r.status, text.slice(0, 500));
        return NextResponse.json({ error: "Google Places sorgusu başarısız" }, { status: 502 });
      }
    } catch {
      if (alumasRows.length === 0) {
        return NextResponse.json({ error: "Google Places sorgusu başarısız" }, { status: 502 });
      }
    }
  } else if (alumasRows.length === 0) {
    return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY tanımlı değil" }, { status: 503 });
  }

  // Deduplicate Google rows that already match an ALUMAS facility by normalized name
  const alumasNameSet = new Set(alumasRows.map((r) => normalizeTextKey(r.name)));
  const uniqueGoogleRows = googleRows.filter((g) => !alumasNameSet.has(normalizeTextKey(g.name)));

  let rows = [...alumasRows, ...uniqueGoogleRows];

  // Post-filter to aggressively remove locksmiths, non-health results, and any insurance company offices
  if (category === "emergency" || cfg.text) {
    rows = rows.filter(
      (r: any) =>
        !r.name.toLowerCase().includes("çilingir") &&
        !r.name.toLowerCase().includes("oto") &&
        !r.name.toLowerCase().includes("çekici") &&
        !r.name.toLowerCase().includes("kilit") &&
        !r.name.toLowerCase().includes("tamir") &&
        !r.name.toLowerCase().includes("veteriner")
    );
  }

  if (ownership === "private") {
    rows = rows.filter((r: any) => {
      const n = r.name.toLowerCase();
      return (
        n.includes("özel") ||
        n.includes("vakıf") ||
        n.includes("medical") ||
        n.includes("medicana") ||
        n.includes("acıbadem") ||
        n.includes("memorial") ||
        n.includes("liv") ||
        n.includes("florence")
      );
    });
  } else if (ownership === "public") {
    rows = rows.filter((r: any) => {
      const n = r.name.toLowerCase();
      return (
        !n.includes("özel") &&
        !n.includes("vakıf") &&
        !n.includes("medical") &&
        !n.includes("medicana") &&
        !n.includes("acıbadem") &&
        !n.includes("memorial") &&
        !n.includes("liv") &&
        !n.includes("florence")
      );
    });
  }

  rows.sort((a: any, b: any) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

  if (activeInsurer && (strictConfirmedOnly || prioritizeInNetwork)) {
    rows = filterAndRankByInsuranceDiscovery(rows, {
      strictConfirmedOnly,
      prioritizeInNetwork,
      hasGeo: true,
    });
  }

  return NextResponse.json({
    source: key ? "ALUMAS + Google Places" : "ALUMAS Directory",
    category,
    ownership,
    rows,
    attribution: "Google",
  });
}
