import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {}

  return NextResponse.json({
    version: process.env.APP_VERSION || "dev",
    buildSha: process.env.BUILD_SHA || "local",
    channel: process.env.RELEASE_CHANNEL || "development",
    maintenance: process.env.MAINTENANCE_MODE === "true",
    databaseReady: db,
    features: {
      video: process.env.FEATURE_VIDEO_CONSULTATION !== "false",
      tourism: process.env.FEATURE_HEALTH_TOURISM !== "false",
      homeCare: process.env.FEATURE_HOME_CARE !== "false",
      familyAccess: process.env.FEATURE_FAMILY_ACCESS !== "false",
    },
  });
}
