import { prisma } from "../lib/prisma.ts";

export const TARGET_ORG_IDS = [
  "cmtkaemzp0044ypj4dyc61s0s", // Alumas Şehir Hastanesi
  "cmtkaen610046ypj4n2fpx0xu", // Alumas Merkez Eczanesi
  "cmty5ymkp0006l404sx6vf5en", // Yiğitcan TİLAVER
  "cmu18l9mf0001l4045y5w5z6e", // Ayça Şirin Görüntüleme Merkezi
  "cmtydyvkv0006kv04yl3m1ge3", // Karahanlı Hospital
  "cmueeqyr4000cl804uezgjcug", // Hastane Beyaz
  "cmtkaenc90048ypj4z0och71h", // Alumas Sağlık Kliniği
  "cmuff1wyg000al804x30bcn1h", // Lab Cem
  "cmud8kfx70006jx046agcovfk", // Görüntüleme Arif
  "cmtycihfh0001l204fpz8ymb7", // Abuzer Kömürcü
  "cmud8uvay0006ju047exfbnje", // Çam ve Sakura
  "cmudbbvw7000aypggo66s5p34", // Lab Test
];

async function main() {
  console.log("=== STEP 1: RECORD CURRENT STATE BEFORE UNPUBLISHING ===");
  const before = await prisma.organization.findMany({
    where: { id: { in: TARGET_ORG_IDS } },
    select: { id: true, name: true, slug: true, isPublished: true, status: true },
  });
  console.log(`Found targeted organizations in DB: ${before.length} / 12`);
  for (const o of before) {
    console.log(`  - [${o.id}] ${o.name} (${o.slug}) -> isPublished: ${o.isPublished}, status: ${o.status}`);
  }

  if (before.length !== 12) {
    throw new Error(`Expected exactly 12 organizations, found ${before.length}. Aborting for safety.`);
  }

  console.log("\n=== STEP 2: TRANSACTIONAL UPDATE ===");
  const result = await prisma.$transaction(async (tx) => {
    return tx.organization.updateMany({
      where: { id: { in: TARGET_ORG_IDS } },
      data: { isPublished: false },
    });
  });

  console.log(`Transactional update complete: ${result.count} records updated.`);

  console.log("\n=== STEP 3: POST-UPDATE VERIFICATION ===");
  const after = await prisma.organization.findMany({
    where: { id: { in: TARGET_ORG_IDS } },
    select: { id: true, name: true, slug: true, isPublished: true, status: true },
  });

  let publishedCount = 0;
  for (const o of after) {
    console.log(`  - [${o.id}] ${o.name} (${o.slug}) -> isPublished: ${o.isPublished}`);
    if (o.isPublished) publishedCount++;
  }

  if (publishedCount > 0) {
    throw new Error(`CRITICAL: ${publishedCount} test organizations are still published!`);
  }

  console.log("\n=== STEP 4: DIRECTORY INTEGRITY CHECK ===");
  const dirCount = await prisma.directoryInstitution.count();
  console.log(` authoritative DirectoryInstitution rows: ${dirCount} (expected: 40)`);
  if (dirCount !== 40) {
    throw new Error(`DirectoryInstitution count changed! Expected 40, found ${dirCount}`);
  }

  const { queryNormalizedDirectory } = await import("../lib/institution-directory.ts");
  const publicItems = await queryNormalizedDirectory({});
  console.log(`Public directory items now visible: ${publicItems.length}`);
  const publicVerified = publicItems.filter((i) => i.isVerified);
  console.log(`Public items with blue verified badge: ${publicVerified.length}`);

  const testStillVisible = publicItems.filter((i) => i.organizationId && TARGET_ORG_IDS.includes(i.organizationId));
  console.log(`Test organizations visible in public directory: ${testStillVisible.length}`);

  if (testStillVisible.length > 0) {
    throw new Error(`CRITICAL: Test organizations still leaked into public directory!`);
  }

  console.log("\n✔ SUCCESS: All 12 test organizations safely unpublished with zero collateral impact.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});

