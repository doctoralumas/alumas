import { prisma } from "@/lib/prisma";
import { snapshot } from "@/lib/metrics";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [audit24, failed24, loginsFailed, appointments, users] = await Promise.all([
    prisma.auditLog.count({ where: { createdAt: { gte: since } } }),
    prisma.auditLog.count({ where: { createdAt: { gte: since }, outcome: { not: "success" } } }),
    prisma.loginAttempt.count({ where: { createdAt: { gte: since }, success: false } }),
    prisma.appointment.count({ where: { createdAt: { gte: since } } }),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
  ]);

  return Response.json({
    ok: true,
    data: {
      window: "24h",
      audit24,
      failedAudit24: failed24,
      failedLogins24: loginsFailed,
      newAppointments24: appointments,
      newUsers24: users,
      process: snapshot(),
    },
  });
}
