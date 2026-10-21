import { prisma } from "../lib/prisma";
import { CANONICAL_SPECIALTIES, findCanonicalSpecialty } from "../lib/specialty-taxonomy";

async function testMapping() {
  const dd = await prisma.directoryDoctor.findMany({ select: { specialty: true } });
  const docs = await prisma.doctor.findMany({ select: { specialty: true } });
  const all = [...dd.map((d) => d.specialty), ...docs.map((d) => d.specialty)].filter(Boolean);
  const unique = Array.from(new Set(all));

  let unmappedCount = 0;
  console.log(`Testing mapping for ${unique.length} unique raw specialties against canonical taxonomy (${CANONICAL_SPECIALTIES.length} categories)...`);

  for (const raw of unique) {
    const canonical = findCanonicalSpecialty(raw);
    if (!canonical) {
      console.error(`  [UNMAPPED] "${raw}"`);
      unmappedCount++;
    }
  }

  if (unmappedCount === 0) {
    console.log("SUCCESS: 100% of raw specialties mapped to canonical specialties cleanly!");
  } else {
    console.error(`FAILURE: ${unmappedCount} raw specialties unmapped.`);
    process.exit(1);
  }
}

testMapping()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
