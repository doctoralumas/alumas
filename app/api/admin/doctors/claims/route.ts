import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { evaluateClaimIdentityMatch } from "@/lib/claim-identity-verification";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  const user = auth.user;

  const claims = await prisma.doctorClaim.findMany({
    include: {
      directoryDoctor: true,
      doctor: {
        include: {
          verificationDocuments: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
      claimant: {
        select: { id: true, name: true, email: true, phone: true },
      },
      reviewedBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const annotatedClaims = claims.map((claim) => ({
    ...claim,
    identityMatch: evaluateClaimIdentityMatch(claim.claimant?.name, claim.directoryDoctor?.name),
  }));

  return NextResponse.json({
    ok: true,
    data: annotatedClaims,
    total: annotatedClaims.length,
  });
}

