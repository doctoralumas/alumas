import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || undefined;
  const outcome = url.searchParams.get("outcome") || undefined;
  const entityType = url.searchParams.get("entityType") || undefined;
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const createdAt: any = {};
  if (from) createdAt.gte = new Date(from);
  if (to) createdAt.lte = new Date(to);

  const where: any = {
    ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
    ...(outcome ? { outcome } : {}),
    ...(entityType ? { entityType } : {}),
    ...(from || to ? { createdAt } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.auditLog.count({ where }),
  ]);

  return Response.json({ ok: true, data: { rows, total } });
}
