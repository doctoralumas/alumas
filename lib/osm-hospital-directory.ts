import type { ExternalHospital } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { NormalizedDirectoryItem } from "@/lib/institution-directory";
import { normalizeOfficialWebsiteUrl } from "@/lib/external-url";
import osmRecords from "@/data/osm/hospitals.json";

const INDEPENDENT_DATASET_SHA256 = "d6a0bd7d9e433c2912626acc7f2cf334f0c1bb22b9384826104aee7525ab48f0";

/**
 * Canonical standalone ODbL directory snapshot. This data is compiled independently
 * of ALUMAS-owned institutions and is the same snapshot served by the export route.
 * Keep the snapshot available for browsing while the production OSM table is being
 * brought up to date. Never filter it against the private institution inventory.
 */
type OsmDirectoryRow = Pick<ExternalHospital,
  "sourceId" | "name" | "city" | "district" | "locality" | "address" |
  "phone" | "website" | "latitude" | "longitude" | "sourceUrl" |
  "sourceDate" | "licenseUrl">;

const independentDirectoryRows: OsmDirectoryRow[] = osmRecords.map((r) => ({
  sourceId: r.source_id,
  name: r.name,
  city: r.osm_city || null,
  district: r.osm_district || null,
  locality: r.osm_locality || null,
  address: r.address || null,
  phone: r.phone || null,
  website: r.website || null,
  latitude: Number(r.latitude),
  longitude: Number(r.longitude),
  sourceUrl: r.source_url,
  sourceDate: r.source_date,
  licenseUrl: r.license,
})).sort((a, b) => a.name.localeCompare(b.name, "tr-TR") || a.sourceId.localeCompare(b.sourceId));


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

/**
 * A hospital entry needs at least one supporting public detail beyond its name and
 * map pin before it is promoted to the discovery UI. All 1,366 original OSM rows
 * remain intact and downloadable under the ODbL; nothing is deleted from the DB.
 */
function supportedHospital(row: OsmDirectoryRow): boolean {
  const name = key(row.name);
  if (!name) return false;
  if (/(^| )eski( |$)/.test(name)) return false;
  if (/(^| )(acil girisi|acil giris|acil servisi|acil bolumu|kvc girisi|radyasyon onkolojisi|merkez poliklinigi|poliklinikler|poliklinigi|ek binasi|ana binasi)( |$)/.test(name)) return false;
  if (/(^| )acil$/.test(name)) return false;
  return Boolean(row.city || row.district || row.locality || row.address || row.phone || row.website);
}

function facilityTokens(name: string): string[] {
  return key(name)
    .split(" ")
    .filter((token) => token && !["ozel", "hospital", "hastane", "hastanesi", "hastaneleri", "t", "c"].includes(token));
}

function distanceMetres(a: {latitude: number | null; longitude: number | null}, b: {latitude: number | null; longitude: number | null}): number {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) return Infinity;
  const lat1 = a.latitude * Math.PI / 180, lat2 = b.latitude * Math.PI / 180;
  const dLat = lat2 - lat1, dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(h));
}

function sameFacilityName(a: string, b: string, metres: number): boolean {
  if (metres > 150) return false;
  const first = key(a), second = key(b);
  if (first === second && first.length > 7) return true;
  const firstTokens = facilityTokens(a), secondTokens = facilityTokens(b);
  if (!firstTokens.length || !secondTokens.length) return false;
  const aKey = firstTokens.join(" "), bKey = secondTokens.join(" ");
  if (aKey === bKey && aKey.length > 7) return true;
  if (metres > 40) return false;
  const smaller = firstTokens.length <= secondTokens.length ? firstTokens : secondTokens;
  const larger = smaller === firstTokens ? secondTokens : firstTokens;
  const overlaps = smaller.filter((token) => larger.includes(token) && token.length >= 4).length;
  // A generic term (e.g. 'Devlet Hastanesi') cannot establish a match by itself.
  return overlaps >= 2 && overlaps / larger.length >= 0.65
    || metres <= 12 && overlaps >= 1 && overlaps === smaller.length
    && smaller.join("").length >= 6;
}

function recordQuality(row: OsmDirectoryRow): number {
  return Number(Boolean(row.website)) * 16 + Number(Boolean(row.address)) * 8
    + Number(Boolean(row.city)) * 4 + Number(Boolean(row.phone)) * 2
    + Number(row.sourceId.startsWith("OSM:way/")) + row.name.length / 1000;
}

/**
 * Deduplicate only inside the independently sourced OSM layer. Never infer that
 * two hospitals are the same based on nearby coordinates alone.
 */
function independentDisplayIds(rows: OsmDirectoryRow[]): Set<string> {
  const selected: OsmDirectoryRow[] = [];
  const sorted = rows.filter(supportedHospital)
    .sort((a, b) => recordQuality(b) - recordQuality(a) || a.sourceId.localeCompare(b.sourceId));
  for (const row of sorted) {
    const repeated = selected.some((existing) => {
      const metres = distanceMetres(row, existing);
      return sameFacilityName(row.name, existing.name, metres);
    });
    if (!repeated) selected.push(row);
  }
  return new Set(selected.map((row) => row.sourceId));
}

const displayOsmIds = independentDisplayIds(independentDirectoryRows);

/** Display-only suppression, retaining the original independently licensed export. */
export function removeCuratedHospitalDuplicates(
  osm: NormalizedDirectoryItem[], curated: NormalizedDirectoryItem[]
): NormalizedDirectoryItem[] {
  const existingHospitals = curated.filter((item) => item.type === "HOSPITAL");
  return osm.filter((osmRow) => !existingHospitals.some((item) => {
    if (item.city && osmRow.city && key(item.city) !== key(osmRow.city)) return false;
    const metres = distanceMetres(item, osmRow);
    return sameFacilityName(item.name, osmRow.name, metres);
  }));
}


/** Search the OSM layer independently, without cross-source matching. */
export function filterOsmHospitalRecords(rows: OsmDirectoryRow[], query: string, city = ""): NormalizedDirectoryItem[] {
  const search = key(query);
  return rows.filter((r) => displayOsmIds.has(r.sourceId) && (!search || key([r.name, r.address, r.city, r.district, r.locality].filter(Boolean).join(" ")).includes(search))
    && (!city || (r.city && key(r.city) === key(city))))
    .map((r) => {
      const officialWebsite = normalizeOfficialWebsiteUrl(r.website);
      return {
      id: r.sourceId, directoryId: null, organizationId: null,
      slug: r.sourceId.toLowerCase().replace(/[^a-z0-9]+/g, "-"), type: "HOSPITAL" as const,
      name: r.name, city: r.city || "", district: r.district, address: r.address || "", phone: r.phone || "", description: null,
      latitude: r.latitude, longitude: r.longitude, distanceKm: null, rating: null,
      isOnDuty: false, onDutyUntil: null, isVerified: false, verificationState: "UNREGISTERED" as const,
      verifiedAt: null, navigationMode: officialWebsite ? "EXTERNAL" as const : "NONE" as const, primaryHref: officialWebsite, isExternalDestination: Boolean(officialWebsite),
      officialWebsite, hasOfficialWebsite: Boolean(officialWebsite), canClaim: false, source: "OPENSTREETMAP_ODBL",
      externalRef: r.sourceId, osmSourceDate: r.sourceDate, osmWebsite: officialWebsite, osmLocality: r.locality || "",
      lastVerifiedAt: null, _count: { doctors: 0, reviews: 0 }, services: [], imagingExams: [], laboratoryTests: [], insuranceMatch: null,
      };
    });
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

  // Use the Supabase OSM table when it exactly matches the independent source.
  // The older 997-row inventory does not match: do not silently omit 369 records.
  // Keep the independent, publicly downloadable ODbL snapshot as a read-only
  // fallback, without inserting anything or comparing with ALUMAS institutions.
  try {
    const count = await prisma.externalHospital.count();
    if (count === independentDirectoryRows.length) {
      const rows = await prisma.externalHospital.findMany({
        orderBy: [{ name: "asc" }, { sourceId: "asc" }],
      });
      if (independentDatasetMatches(rows)) {
        return filterOsmHospitalRecords(rows, query, city);
      }
    }
  } catch {
    // The OSM table may be unavailable during a staged rollout. No DB writes.
  }

  return filterOsmHospitalRecords(independentDirectoryRows, query, city);
}
