#!/usr/bin/env node
/**
 * Deterministic, Idempotent DirectoryInstitution Backfill & Linking Script
 *
 * Default mode: --dry-run (strictly read-only; makes zero database writes).
 * To apply changes after explicit review/approval:
 *   node scripts/backfill-directory-institutions.mjs --apply
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CURATED_DIRECTORY_FIXTURES = [
  {
    id: "dir-acibadem-maslak",
    slug: "acibadem-maslak-hastanesi",
    name: "Acıbadem Maslak Hastanesi",
    type: "HOSPITAL",
    city: "İstanbul",
    district: "Sarıyer",
    address: "Darüşşafaka Mah. Büyükdere Cad. No:40 Maslak",
    phone: "+90 212 304 44 44",
    officialWebsite: "https://www.acibadem.com.tr",
    description: "Çok branşlı genel hastane ve tanı merkezi (Harici Dizin Kaydı).",
    latitude: 41.1264,
    longitude: 29.0247,
    isOnDuty: false,
    onDutyUntil: null,
    source: "CURATED_PUBLIC_DIRECTORY",
    externalRef: "TR-IST-ACIBADEM-MASLAK",
    lastVerifiedAt: new Date("2026-10-01T09:00:00.000Z"),
    isActive: true,
  },
  {
    id: "dir-amerikan-hastanesi",
    slug: "vkv-amerikan-hastanesi",
    name: "VKV Amerikan Hastanesi",
    type: "HOSPITAL",
    city: "İstanbul",
    district: "Şişli",
    address: "Teşvikiye Mah. Güzelbahçe Sok. No:20 Nişantaşı",
    phone: "+90 212 444 37 77",
    officialWebsite: "https://www.amerikanhastanesi.org",
    description: "Genel hastane ve poliklinik hizmetleri (Harici Dizin Kaydı).",
    latitude: 41.0522,
    longitude: 28.9935,
    isOnDuty: false,
    onDutyUntil: null,
    source: "CURATED_PUBLIC_DIRECTORY",
    externalRef: "TR-IST-AMERIKAN-SISLI",
    lastVerifiedAt: new Date("2026-10-01T09:00:00.000Z"),
    isActive: true,
  },
  {
    id: "dir-memorial-sisli",
    slug: "memorial-sisli-hastanesi",
    name: "Memorial Şişli Hastanesi",
    type: "HOSPITAL",
    city: "İstanbul",
    district: "Şişli",
    address: "Kaptanpaşa Mah. Piyalepaşa Bulvarı No:4",
    phone: "+90 212 314 66 66",
    officialWebsite: "https://www.memorial.com.tr",
    description: "Sağlık hizmetleri ve ileri tanı merkezi (Harici Dizin Kaydı).",
    latitude: 41.0615,
    longitude: 28.9734,
    isOnDuty: false,
    onDutyUntil: null,
    source: "CURATED_PUBLIC_DIRECTORY",
    externalRef: "TR-IST-MEMORIAL-SISLI",
    lastVerifiedAt: new Date("2026-10-01T09:00:00.000Z"),
    isActive: true,
  },
  {
    id: "dir-ankara-bilkent-sehir",
    slug: "ankara-bilkent-sehir-hastanesi",
    name: "Ankara Bilkent Şehir Hastanesi",
    type: "HOSPITAL",
    city: "Ankara",
    district: "Çankaya",
    address: "Üniversiteler Mah. 1604. Cad. No:9 Bilkent",
    phone: "+90 312 552 60 00",
    officialWebsite: "https://ankarasehir.saglik.gov.tr",
    description: "Bölge eğitim ve araştırma şehir hastanesi kampüsü (Harici Dizin Kaydı).",
    latitude: 39.8986,
    longitude: 32.7565,
    isOnDuty: false,
    onDutyUntil: null,
    source: "CURATED_PUBLIC_DIRECTORY",
    externalRef: "TR-ANK-BILKENT-SEHIR",
    lastVerifiedAt: new Date("2026-10-01T09:00:00.000Z"),
    isActive: true,
  },
  {
    id: "dir-medicana-kadikoy",
    slug: "medicana-kadikoy-hastanesi",
    name: "Medicana Kadıköy Hastanesi",
    type: "HOSPITAL",
    city: "İstanbul",
    district: "Kadıköy",
    address: "Zühtüpaşa Mah. Recep Peker Cad. No:11 Kızıltoprak",
    phone: null,
    officialWebsite: "https://www.medicana.com.tr",
    description: "Çok branşlı genel hastane ve tanı merkezi (Harici Dizin Kaydı).",
    latitude: 40.9854,
    longitude: 29.0389,
    isOnDuty: false,
    onDutyUntil: null,
    source: "CURATED_PUBLIC_DIRECTORY",
    externalRef: "TR-IST-MEDICANA-KADIKOY",
    lastVerifiedAt: new Date("2026-10-01T09:00:00.000Z"),
    isActive: true,
  },
];

function normalizeTextKey(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function canonicalKey(name, city, type) {
  return `${String(type || "").toUpperCase()}::${normalizeTextKey(city)}::${normalizeTextKey(name)}`;
}

async function main() {
  const applyMode = process.argv.includes("--apply");
  const externalOnly = process.argv.includes("--external-only");
  const onlyApprovedOrgs = process.argv.includes("--only-approved-orgs");
  const orgSlugsArg = process.argv.find((a) => a.startsWith("--org-slugs="));
  const allowedOrgSlugs = orgSlugsArg
    ? new Set(
        orgSlugsArg
          .slice("--org-slugs=".length)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      )
    : null;

  const [existingDirectoryRows, organizations] = await Promise.all([
    prisma.directoryInstitution.findMany(),
    prisma.organization.findMany({
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const approvedOrgs = externalOnly
    ? []
    : organizations.filter(
        (org) =>
          org.status === "APPROVED" &&
          org.isPublished === true &&
          org.verifiedAt != null &&
          (!allowedOrgSlugs || allowedOrgSlugs.has(org.slug))
      );

  const approvedOrgByKey = new Map();
  for (const org of approvedOrgs) {
    const key = canonicalKey(org.name, org.city, org.type);
    if (!approvedOrgByKey.has(key)) {
      approvedOrgByKey.set(key, org);
    }
  }

  const matchedOrgIds = new Set();
  const operations = [];

  // 1. Plan upserts for curated external directory fixtures (skipped if --only-approved-orgs is passed)
  const fixturesToProcess = onlyApprovedOrgs ? [] : CURATED_DIRECTORY_FIXTURES;
  for (const fixture of fixturesToProcess) {
    const key = canonicalKey(fixture.name, fixture.city, fixture.type);
    const matchingApprovedOrg = approvedOrgByKey.get(key) || null;
    if (matchingApprovedOrg) {
      matchedOrgIds.add(matchingApprovedOrg.id);
    }

    const existing = existingDirectoryRows.find(
      (r) =>
        r.id === fixture.id ||
        r.slug === fixture.slug ||
        (fixture.externalRef && r.externalRef === fixture.externalRef)
    );

    operations.push({
      action: existing ? "UPDATE_CURATED" : "INSERT_CURATED",
      id: existing ? existing.id : fixture.id,
      slug: fixture.slug,
      name: fixture.name,
      type: fixture.type,
      city: fixture.city,
      organizationId: matchingApprovedOrg ? matchingApprovedOrg.id : existing?.organizationId || null,
      payload: {
        ...fixture,
        organizationId: matchingApprovedOrg ? matchingApprovedOrg.id : existing?.organizationId || null,
      },
    });
  }

  // 2. Plan upserts for existing approved ALUMAS Organizations (including alumas-sehir-hastanesi)
  for (const org of approvedOrgs) {
    if (matchedOrgIds.has(org.id)) continue;

    const existing = existingDirectoryRows.find(
      (r) => r.organizationId === org.id || r.slug === org.slug
    );

    const deterministicId = existing ? existing.id : `dir-org-${org.slug}`;
    const externalRef = existing?.externalRef || `ALUMAS-ORG-${org.id}`;

    operations.push({
      action: existing ? "UPDATE_LINKED_ORG" : "INSERT_LINKED_ORG",
      id: deterministicId,
      slug: org.slug,
      name: org.name,
      type: org.type,
      city: org.city,
      organizationId: org.id,
      payload: {
        id: deterministicId,
        slug: org.slug,
        name: org.name,
        type: org.type,
        city: org.city,
        district: org.district || null,
        address: org.address,
        phone: org.phone || null,
        officialWebsite: org.website || null,
        description: org.description || null,
        latitude: org.latitude ?? null,
        longitude: org.longitude ?? null,
        isOnDuty: Boolean(org.isOnDuty),
        onDutyUntil: org.onDutyUntil || null,
        source: "ALUMAS_APPROVED_BACKFILL",
        externalRef,
        lastVerifiedAt: org.verifiedAt || new Date(),
        isActive: true,
        organizationId: org.id,
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        mode: applyMode ? "APPLY" : "DRY_RUN",
        externalOnly,
        existingDirectoryInstitutionCount: existingDirectoryRows.length,
        totalOrganizationsInDb: organizations.length,
        approvedOrganizationsToLink: approvedOrgs.length,
        curatedFixturesCount: CURATED_DIRECTORY_FIXTURES.length,
        plannedOperationsCount: operations.length,
        alumasSehirHastanesiIncluded: operations.some(
          (op) => op.slug === "alumas-sehir-hastanesi" && op.organizationId != null
        ),
        operations: operations.map((op) => ({
          action: op.action,
          id: op.id,
          slug: op.slug,
          name: op.name,
          type: op.type,
          city: op.city,
          organizationId: op.organizationId,
        })),
      },
      null,
      2
    )
  );

  if (!applyMode) {
    console.log(
      "\n[DRY-RUN] Zero rows were written. Pass --apply after approval to execute the backfill."
    );
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const op of operations) {
      const { id, ...rest } = op.payload;
      await tx.directoryInstitution.upsert({
        where: { slug: op.slug },
        create: { id, ...rest },
        update: rest,
      });
    }
  });

  console.log(`\n[APPLIED] Successfully upserted ${operations.length} DirectoryInstitution rows.`);
}

main()
  .catch((err) => {
    console.error("Backfill error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

