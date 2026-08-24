import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const allowed = new Set(["steps", "heart_rate", "weight", "sleep"]);

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const body = await req.json();
  const provider = String(body.provider || "");
  const samples = Array.isArray(body.samples) ? body.samples.slice(0, 1000) : [];
  if (!["apple_health", "health_connect"].includes(provider)) {
    return NextResponse.json({ error: "Sağlayıcı desteklenmiyor" }, { status: 400 });
  }

  const valid = samples
    .filter((s: any) => allowed.has(String(s.type)) && Number.isFinite(Number(s.value)) && String(s.unit || "").length <= 32)
    .map((s: any) => ({
      userId: user.id,
      type: String(s.type),
      value: Number(s.value),
      unit: String(s.unit || ""),
      measuredAt: s.measuredAt ? new Date(s.measuredAt) : new Date(),
      note: `Synced from ${provider}`,
      sourceRef: s.sourceRef ? `${user.id}:${String(s.sourceRef).slice(0, 180)}` : null,
    }));

  const created = valid.length
    ? await prisma.healthEntry.createMany({ data: valid, skipDuplicates: true })
    : { count: 0 };

  const sleepRows = samples.filter((s:any)=>String(s.type)==="sleep" && s.startedAt && s.endedAt).map((s:any)=>({userId:user.id,startedAt:new Date(s.startedAt),endedAt:new Date(s.endedAt),sourceRef:s.sourceRef?`${user.id}:${String(s.sourceRef).slice(0,180)}`:null,note:`Synced from ${provider}`})).filter((s:any)=>Number.isFinite(s.startedAt.getTime())&&Number.isFinite(s.endedAt.getTime())&&s.endedAt>s.startedAt);
  const sleepCreated = sleepRows.length ? await prisma.sleepRecord.createMany({data:sleepRows,skipDuplicates:true}) : {count:0};

  await prisma.healthIntegration.updateMany({
    where: { userId: user.id, provider },
    data: { lastSyncAt: new Date() },
  });

  return NextResponse.json({ imported: created.count, sleepImported: sleepCreated.count, received: valid.length });
}
