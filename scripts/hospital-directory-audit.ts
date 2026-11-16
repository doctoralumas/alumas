/**
 * Read-only hospital QA. Does not mutate either source or database records.
 * Usage: npm run hospital:audit
 *        npm run hospital:audit -- --with-db
 */
import { readFileSync, existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import {
  hospitalDistanceMetres,
  isDisplayableOsmHospital,
  samePhysicalHospital,
  uniqueOsmDisplayIds,
  type HospitalIdentity,
  type SourceHospitalIdentity,
} from "../lib/osm-hospital-matching";

type OsmExtractRow = {
  source_id: string; name: string; latitude: string; longitude: string;
  source_url: string; license: string; source_date: string;
  osm_city?: string; osm_district?: string; address?: string;
  phone?: string; website?: string;
};

const raw = JSON.parse(
  readFileSync(new URL("../data/osm/hospitals.json", import.meta.url), "utf8")
) as OsmExtractRow[];

const records: SourceHospitalIdentity[] = raw.map((row) => ({
  sourceId: row.source_id,
  name: row.name,
  city: row.osm_city || null,
  district: row.osm_district || null,
  address: row.address || null,
  website: row.website || null,
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
}));

const issues: string[] = [];
const seen = new Set<string>();
for (const row of raw) {
  if (!/^OSM:(node|way|relation)\/[0-9]+$/.test(row.source_id)) {
    issues.push("INVALID_SOURCE_ID " + row.source_id);
  }
  if (seen.has(row.source_id)) issues.push("DUPLICATE_SOURCE_ID " + row.source_id);
  seen.add(row.source_id);
  if (!row.name?.trim()) issues.push("MISSING_NAME " + row.source_id);
  if (row.source_url !== "https://www.openstreetmap.org/" + row.source_id.slice(4)) {
    issues.push("INVALID_SOURCE_URL " + row.source_id);
  }
  if (row.license !== "https://www.openstreetmap.org/copyright") {
    issues.push("INVALID_LICENSE " + row.source_id);
  }
  if (!row.source_date || !Number.isFinite(Date.parse(row.source_date))) {
    issues.push("INVALID_SOURCE_DATE " + row.source_id);
  }
  const lat = Number(row.latitude), lon = Number(row.longitude);
  if (!Number.isFinite(lat) || lat < 35.5 || lat > 42.5 ||
      !Number.isFinite(lon) || lon < 25 || lon > 45.2) {
    issues.push("OUTSIDE_TURKIYE_BOUNDS " + row.source_id);
  }
}
if (raw.length !== 1366) issues.push("SOURCE_SNAPSHOT_COUNT_CHANGED " + raw.length);

const displayIds = uniqueOsmDisplayIds(records);
const displayed = records.filter((row) => displayIds.has(row.sourceId));
const excluded = records.filter((row) => !isDisplayableOsmHospital(row));
const suppressedDuplicates = records
  .filter((row) => isDisplayableOsmHospital(row) && !displayIds.has(row.sourceId))
  .map((row) => {
    const kept = displayed.find((candidate) => samePhysicalHospital(row, candidate));
    if (!kept) issues.push("UNEXPLAINED_SUPPRESSION " + row.sourceId);
    return {
      suppressed: row.sourceId,
      suppressedName: row.name,
      preferred: kept?.sourceId || null,
      preferredName: kept?.name || null,
      distanceMetres: kept ? Math.round(hospitalDistanceMetres(row, kept)) : null,
    };
  });

const summary: Record<string, unknown> = {
  scope: "independent OSM Türkiye hospital dataset (read-only)",
  snapshotCount: raw.length,
  uniqueSourceIds: seen.size,
  excludedNonFacilityOrSubdivision: excluded.length,
  duplicateOsmMarkers: suppressedDuplicates.length,
  displayedOsmHospitalsBeforeCuratedMatching: displayed.length,
  metadataMissing: {
    city: raw.filter((row) => !row.osm_city).length,
    district: raw.filter((row) => !row.osm_district).length,
    address: raw.filter((row) => !row.address).length,
    phone: raw.filter((row) => !row.phone).length,
    website: raw.filter((row) => !row.website).length,
  },
  suppressedDuplicates,
  excludedSample: excluded.slice(0, 35).map((row) => ({ id: row.sourceId, name: row.name })),
};

async function main() {
if (process.argv.includes("--with-db")) {
  // Next.js loads these automatically, but a standalone tsx script does not.
  // Existing process environment variables retain precedence.
  for (const file of [".env", ".env.local"]) {
    if (existsSync(file)) process.loadEnvFile(file);
  }
  const db = new PrismaClient();
  try {
    const [external, curated, organizations] = await Promise.all([
      db.externalHospital.findMany({
        select: {
          sourceId: true, name: true, city: true, address: true,
          latitude: true, longitude: true, sourceUrl: true, licenseUrl: true,
        },
      }),
      db.directoryInstitution.findMany({
        where: { type: "HOSPITAL", isActive: true },
        select: { id: true, name: true, city: true, address: true, latitude: true, longitude: true },
      }),
      db.organization.findMany({
        where: { type: "HOSPITAL", isPublished: true },
        select: { id: true, name: true, city: true, address: true, latitude: true, longitude: true },
      }),
    ]);
    const sourceMap = new Map(raw.map((row) => [row.source_id, row]));
    const dbIds = new Set(external.map((row) => row.sourceId));
    const missingInDb = raw.filter((row) => !dbIds.has(row.source_id)).map((row) => row.source_id);
    const unexpectedInDb = external.filter((row) => !sourceMap.has(row.sourceId)).map((row) => row.sourceId);
    const changedInDb = external.filter((row) => {
      const source = sourceMap.get(row.sourceId);
      return source && (
        source.name !== row.name ||
        (source.osm_city || "") !== (row.city || "") ||
        (source.address || "") !== (row.address || "") ||
        Math.abs(Number(source.latitude) - row.latitude) > 1e-8 ||
        Math.abs(Number(source.longitude) - row.longitude) > 1e-8 ||
        source.source_url !== row.sourceUrl ||
        source.license !== row.licenseUrl
      );
    }).map((row) => row.sourceId);

    if (missingInDb.length || unexpectedInDb.length || changedInDb.length) {
      issues.push("EXTERNAL_HOSPITAL_DB_DIFFERS_FROM_INDEPENDENT_SNAPSHOT");
    }
    // Compare for display only; never write source-to-curated identity links.
    const curatedFacilities: HospitalIdentity[] = [...curated, ...organizations];
    const curatedMatches = displayed.flatMap((osm) => {
      const match = curatedFacilities.find((facility) => samePhysicalHospital(osm, facility));
      return match ? [{
        osmSourceId: osm.sourceId, osmName: osm.name, existingName: match.name,
        metres: Math.round(hospitalDistanceMetres(osm, match)),
      }] : [];
    });
    summary.database = {
      externalHospitalCount: external.length,
      activeCuratedHospitalCount: curated.length,
      publishedHospitalAccountCount: organizations.length,
      missingInDbCount: missingInDb.length,
      unexpectedInDbCount: unexpectedInDb.length,
      changedInDbCount: changedInDb.length,
      discrepanciesSample: [
        ...missingInDb.slice(0, 10), ...unexpectedInDb.slice(0, 10), ...changedInDb.slice(0, 10),
      ],
      matchedOsmToExistingCardsCount: curatedMatches.length,
      matchedOsmToExistingCards: curatedMatches,
      expectedHospitalCardsBeforeOtherFilters: curatedFacilities.length +
        displayed.length - curatedMatches.length,
      note: "Potentially overlapping curated/organization rows can affect the card total; use the API for the final count.",
    };
  } finally {
    await db.$disconnect();
  }
}
summary.issueCount = issues.length;
summary.issues = issues.slice(0, 100);
console.log(JSON.stringify(summary, null, 2));
if (issues.length) process.exitCode = 1;
}

void main().catch((error: unknown) => {
  console.error("hospital:audit failed", error);
  process.exitCode = 1;
});
