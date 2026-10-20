import { NextResponse } from "next/server";
import { queryNormalizedExperts } from "@/lib/expert-directory";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const specialty = searchParams.get("specialty");
    const city = searchParams.get("city");
    const unclaimedOnly = searchParams.get("unclaimedOnly") === "1" || searchParams.get("unclaimedOnly") === "true";

    const experts = await queryNormalizedExperts({
      q,
      specialty,
      city,
      unclaimedOnly,
    });

    return NextResponse.json({
      ok: true,
      data: experts,
      total: experts.length,
    });
  } catch (error) {
    console.error("Failed to query normalized experts:", error);
    return NextResponse.json(
      { ok: false, error: "Uzman listesi alınırken bir hata oluştu." },
      { status: 500 }
    );
  }
}

