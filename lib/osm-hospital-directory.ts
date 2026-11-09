import type { ExternalHospital } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { NormalizedDirectoryItem } from "@/lib/institution-directory";
import { normalizeOfficialWebsiteUrl } from "@/lib/external-url";
import osmRecords from "@/data/osm/hospitals.json";

const INDEPENDENT_DATASET_SHA256 = "d6a0bd7d9e433c2912626acc7f2cf334f0c1bb22b9384826104aee7525ab48f0";

function enabled(): boolean {
  if (process.env.NODE_ENV === "production") return process.env.ALUMAS_OSM_DIRECTORY_ENABLED === "1" && process.env.ALUMAS_OSM_ODBL_DISTRIBUTION_READY === "1";
  return process.env.ALUMAS_OSM_LOCAL_PREVIEW === "1";
}

export function osmPreviewRequestAllowed(req: Request): boolean {
  if (process.env.NODE_ENV === "production") return enabled();
  return ["localhost", "127.0.0.1", "[::1]", "::1"].includes(new URL(req.url).hostname)
    && !req.headers.has("x-forwarded-host") && !req.headers.has("x-forwarded-for") && enabled();
}

function key(value: string): string {
  return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i").replace(/[^a-z0-9]+/g, " ").trim();
}

/** Search the OSM layer independently, without cross-source matching. */
export function filterOsmHospitalRecords(rows: ExternalHospital[], query: string, city = ""): NormalizedDirectoryItem[] {
  const search = key(query);
  return rows.filter((r) => (!search || key([r.name, r.address, r.city, r.district, r.locality].filter(Boolean).join(" ")).includes(search))
    && (!city || (r.city && key(r.city) === key(city))))
    .map((r) => ({
      id: r.sourceId, directoryId: null, organizationId: null,
      slug: r.sourceId.toLowerCase().replace(/[^a-z0-9]+/g, "-"), type: "HOSPITAL" as const,
      name: r.name, city: r.city || "", district: r.district, address: r.address || "", phone: r.phone || "", description: null,
      latitude: r.latitude, longitude: r.longitude, distanceKm: null, rating: null,
      isOnDuty: false, onDutyUntil: null, isVerified: false, verificationState: "UNREGISTERED" as const,
      verifiedAt: null, navigationMode: "NONE" as const, primaryHref: null, isExternalDestination: false,
      officialWebsite: null, hasOfficialWebsite: false, canClaim: false, source: "OPENSTREETMAP_ODBL",
      externalRef: r.sourceId, osmSourceDate: r.sourceDate, osmWebsite: normalizeOfficialWebsiteUrl(r.website), osmLocality: r.locality || "",
      lastVerifiedAt: null, _count: { doctors: 0, reviews: 0 }, services: [], imagingExams: [], laboratoryTests: [], insuranceMatch: null,
    }));
}

export function exportOsmRecords(rows: ExternalHospital[]) {
  // Explicit allowlist: future internal columns must never enter the public ODbL export.
  return rows.map((r) => ({ sourceId: r.sourceId, name: r.name, city: r.city, district: r.district,
    locality: r.locality, address: r.address, phone: r.phone, website: r.website,
    latitude: r.latitude, longitude: r.longitude, sourceUrl: r.sourceUrl, sourceDate: r.sourceDate,
    licenseUrl: r.licenseUrl }));
}

export function independentDatasetMatches(rows: ExternalHospital[]): boolean {
  const expected = new Map(osmRecords.map((r) => [r.source_id, r]));
  return rows.length === expected.size && new Set(rows.map((r) => r.sourceId)).size === expected.size && !rows.some((r) => {
    const s = expected.get(r.sourceId);
    return !s || r.inventoryFingerprint !== INDEPENDENT_DATASET_SHA256 || r.name !== s.name ||
      (r.city || "") !== s.osm_city || (r.district || "") !== s.osm_district || (r.locality || "") !== s.osm_locality ||
      (r.address || "") !== s.address || (r.phone || "") !== s.phone || (r.website || "") !== s.website ||
      Math.abs(r.latitude - Number(s.latitude)) >= 1e-9 || Math.abs(r.longitude - Number(s.longitude)) >= 1e-9 ||
      r.sourceUrl !== s.source_url || r.sourceDate !== s.source_date || r.licenseUrl !== s.license;
  });
}

export async function readOsmHospitalPreview(query: string, city = ""): Promise<NormalizedDirectoryItem[]> {
  if (!enabled()) return [];
  const rows = await prisma.externalHospital.findMany({ orderBy: [{ name: "asc" }, { sourceId: "asc" }] });
  if (!independentDatasetMatches(rows)) {
    throw new Error("OSM_INDEPENDENT_DATASET_INCOMPLETE");
  }
  return filterOsmHospitalRecords(rows, query, city);
}
