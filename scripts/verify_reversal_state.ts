import { prisma } from "../lib/prisma";
import { queryNormalizedExperts } from "../lib/expert-directory";

async function main() {
  const dirDoctor = await prisma.directoryDoctor.findUnique({
    where: { id: "cmvht427o002fypighba3fnd1" },
    include: { doctor: true, claims: true },
  });

  console.log("=== DIRECTORY DOCTOR RECORD ===");
  console.log({
    id: dirDoctor?.id,
    name: dirDoctor?.name,
    title: dirDoctor?.title,
    specialty: dirDoctor?.specialty,
    hospital: dirDoctor?.hospital,
    city: dirDoctor?.city,
    officialWebsite: dirDoctor?.officialWebsite,
    doctorId: dirDoctor?.doctorId,
    claimsCount: dirDoctor?.claims.length,
    claimStatus: dirDoctor?.claims[0]?.status,
  });

  const searchResults = await queryNormalizedExperts({ q: "Bülent Oktay" });
  console.log("\n=== PUBLIC SEARCH RESULTS FOR 'Bülent Oktay' ===");
  console.log({
    count: searchResults.length,
    firstResult: searchResults[0] ? {
      name: searchResults[0].name,
      title: searchResults[0].title,
      specialty: searchResults[0].specialty,
      hospital: searchResults[0].hospital,
      city: searchResults[0].city,
      isVerified: searchResults[0].isVerified,
      verificationState: searchResults[0].verificationState,
      navigationMode: searchResults[0].navigationMode,
      primaryHref: searchResults[0].primaryHref,
      canClaim: searchResults[0].canClaim,
      doctorId: searchResults[0].doctorId,
      directoryId: searchResults[0].directoryId,
    } : null,
  });

  const abuzerResults = await queryNormalizedExperts({ q: "Abuzer" });
  console.log("\n=== PUBLIC SEARCH RESULTS FOR 'Abuzer' ===");
  console.log({ count: abuzerResults.length });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

