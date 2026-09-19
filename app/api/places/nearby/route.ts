import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

const categories: any = {
  hospital: { types: ["hospital", "general_hospital", "medical_center"] },
  clinic: { types: ["medical_clinic", "medical_center", "dental_clinic"] },
  pharmacy: { types: ["pharmacy", "drugstore"] },
  imaging: { text: "görüntüleme merkezi MR röntgen" },
  doctor: { types: ["doctor"] },
  hotel: { types: ["hotel", "lodging", "resort_hotel", "hostel"] },
  health: { types: ["hospital", "medical_center", "medical_clinic", "medical_lab", "doctor"] },
  emergency: { text: "acil servis hastane", types: ["hospital"] }
};

function distance(a: number, b: number, c: number, d: number) {
  const R = 6371;
  const p = (x: number) => (x * Math.PI) / 180;
  const z = Math.sin(p(c - a) / 2) ** 2 + Math.cos(p(a)) * Math.cos(p(c)) * Math.sin(p(d - b) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(z));
}

function normalize(x: any, lat: number, lng: number) {
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
  };
}

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY tanımlı değil" }, { status: 503 });

  const u = new URL(req.url);
  const lat = Number(u.searchParams.get("lat"));
  const lng = Number(u.searchParams.get("lng"));
  const category = u.searchParams.get("category") || "health";
  const ownership = u.searchParams.get("ownership"); // 'private' or 'public'
  const radius = Math.min(50000, Math.max(100, Number(u.searchParams.get("radius") || 5000)));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ error: "lat/lng gerekli" }, { status: 400 });

  const cfg = categories[category];
  if (!cfg) return NextResponse.json({ error: "Geçersiz kategori" }, { status: 400 });

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
     textQuery = (category === "emergency" ? "Özel Hastane Acil Servis" : (textQuery ? "Özel " + textQuery : "Özel Hastane " + category));
  } else if (ownership === "public") {
     textQuery = (category === "emergency" ? "Devlet Hastanesi Acil Servis" : (textQuery ? "Devlet Hastanesi " + textQuery : "Devlet Hastanesi " + category));
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

  const r = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body), cache: "no-store" });

  if (!r.ok) {
    const text = await r.text();
    console.error("Google Places", r.status, text.slice(0, 500));
    return NextResponse.json({ error: "Google Places sorgusu başarısız" }, { status: 502 });
  }

  const j = await r.json();
  let rows = (j.places || []).map((x: any) => normalize(x, lat, lng));
  
  // Post-filter to aggressively remove locksmiths and non-health results
  if (category === "emergency" || textQuery) {
     rows = rows.filter((r:any) => !r.name.toLowerCase().includes("çilingir") && !r.name.toLowerCase().includes("oto") && !r.name.toLowerCase().includes("çekici") && !r.name.toLowerCase().includes("kilit") && !r.name.toLowerCase().includes("tamir") && !r.name.toLowerCase().includes("veteriner"));
  }
  
  if (ownership === "private") {
     // A private hospital usually has 'Özel', 'Vakıf' or famous group names like 'Medical', 'Acıbadem'
     rows = rows.filter((r:any) => {
        const n = r.name.toLowerCase();
        return n.includes("özel") || n.includes("vakıf") || n.includes("medical") || n.includes("medicana") || n.includes("acıbadem") || n.includes("memorial") || n.includes("liv") || n.includes("florence");
     });
  } else if (ownership === "public") {
     // Public ones usually don't have those.
     rows = rows.filter((r:any) => {
        const n = r.name.toLowerCase();
        return !n.includes("özel") && !n.includes("vakıf") && !n.includes("medical") && !n.includes("medicana") && !n.includes("acıbadem") && !n.includes("memorial") && !n.includes("liv") && !n.includes("florence");
     });
  }

  rows.sort((a: any, b: any) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

  return NextResponse.json({ source: "Google Places", category, ownership, rows, attribution: "Google" });
}
