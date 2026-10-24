import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import AdminStatusBadge from "@/components/admin/admin-status-badge";

export default async function AdminOverviewPage() {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (u.role !== "ADMIN") redirect("/profile");

  const t = await getTranslations("admin.dashboardOverview");

  // Fetch real operational metrics & attention queues
  const [
    pendingDoctorClaims,
    pendingOrgVerifications,
    pendingAgencyVerifications,
    pendingDocReviews,
    pendingOrgReviews,
    openInquiries,
    upcomingAppointments,
    totalUsers,
    totalVerifiedDoctors,
    totalDirectoryDoctors,
    totalOrganizations,
    totalAgencies,
    totalAppointments,
    recentLogs,
  ] = await Promise.all([
    prisma.doctorClaim.count({ where: { status: "PENDING" } }),
    prisma.organization.count({ where: { status: "PENDING" } }),
    prisma.healthTourismAgency.count({ where: { status: "PENDING" } }),
    prisma.doctorReview.count({ where: { status: "PENDING" } }),
    prisma.organizationReview.count({ where: { status: "PENDING" } }),
    prisma.contactInquiry.count({ where: { status: { in: ["new", "in_progress"] } } }),
    prisma.appointment.count({ where: { status: "confirmed", startsAt: { gte: new Date() } } }),
    prisma.user.count(),
    prisma.doctor.count({ where: { isVerified: true } }),
    prisma.directoryDoctor.count(),
    prisma.organization.count(),
    prisma.healthTourismAgency.count(),
    prisma.appointment.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        outcome: true,
        createdAt: true,
      },
    }),
  ]);

  const pendingReviews = pendingDocReviews + pendingOrgReviews;

  function formatDateTime(d: Date) {
    return d.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="page" style={{ paddingTop: "20px", display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Executive Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          borderBottom: "1px solid var(--border-light, #e2e8f0)",
          paddingBottom: "20px",
        }}
      >
        <div>
          <span className="kicker" style={{ color: "#2563eb", fontWeight: 700, fontSize: "12px", textTransform: "uppercase" }}>
            {t("kicker")}
          </span>
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "4px 0 6px", color: "#0f172a", letterSpacing: "-0.03em" }}>
            {t("title")}
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            {t("subtitle")}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "9999px",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#047857",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 6px #10b981",
              }}
            />
            {t("systemHealthy")}
          </div>
        </div>
      </div>

      {/* SECTION 1: ATTENTION QUEUES (Operational Pulse) */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <span style={{ fontSize: "18px" }}>⚡</span>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            {t("attentionQueues")}
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "14px",
          }}
        >
          {/* Claims Queue */}
          <Link
            href="/admin/doctors?tab=claims"
            style={{
              textDecoration: "none",
              background: pendingDoctorClaims > 0 ? "#fffbeb" : "var(--bg, #ffffff)",
              border: pendingDoctorClaims > 0 ? "2px solid #f59e0b" : "1px solid var(--border-light, #e2e8f0)",
              borderRadius: "14px",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                  👨‍⚕️ {t("queueClaims")}
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    color: pendingDoctorClaims > 0 ? "#b45309" : "#10b981",
                  }}
                >
                  {pendingDoctorClaims}
                </span>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: pendingDoctorClaims > 0 ? "#b45309" : "#64748b",
                  marginTop: "6px",
                }}
              >
                {pendingDoctorClaims > 0
                  ? t("queueClaimsPending", { count: pendingDoctorClaims })
                  : t("queueClaimsAllClear")}
              </div>
            </div>
            <div style={{ marginTop: "14px", fontSize: "12px", fontWeight: 700, color: "#2563eb" }}>
              İncele →
            </div>
          </Link>

          {/* Organizations Queue */}
          <Link
            href="/admin/organizations?filter=pending"
            style={{
              textDecoration: "none",
              background: pendingOrgVerifications > 0 ? "#fffbeb" : "var(--bg, #ffffff)",
              border: pendingOrgVerifications > 0 ? "2px solid #f59e0b" : "1px solid var(--border-light, #e2e8f0)",
              borderRadius: "14px",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                  🏥 {t("queueOrgs")}
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    color: pendingOrgVerifications > 0 ? "#b45309" : "#10b981",
                  }}
                >
                  {pendingOrgVerifications}
                </span>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: pendingOrgVerifications > 0 ? "#b45309" : "#64748b",
                  marginTop: "6px",
                }}
              >
                {pendingOrgVerifications > 0
                  ? t("queueOrgsPending", { count: pendingOrgVerifications })
                  : t("queueOrgsAllClear")}
              </div>
            </div>
            <div style={{ marginTop: "14px", fontSize: "12px", fontWeight: 700, color: "#2563eb" }}>
              İncele →
            </div>
          </Link>

          {/* Agencies Queue */}
          <Link
            href="/admin/agencies?status=pending"
            style={{
              textDecoration: "none",
              background: pendingAgencyVerifications > 0 ? "#fffbeb" : "var(--bg, #ffffff)",
              border: pendingAgencyVerifications > 0 ? "2px solid #f59e0b" : "1px solid var(--border-light, #e2e8f0)",
              borderRadius: "14px",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                  ✈️ {t("queueAgencies")}
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    color: pendingAgencyVerifications > 0 ? "#b45309" : "#10b981",
                  }}
                >
                  {pendingAgencyVerifications}
                </span>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: pendingAgencyVerifications > 0 ? "#b45309" : "#64748b",
                  marginTop: "6px",
                }}
              >
                {pendingAgencyVerifications > 0
                  ? t("queueAgenciesPending", { count: pendingAgencyVerifications })
                  : t("queueAgenciesAllClear")}
              </div>
            </div>
            <div style={{ marginTop: "14px", fontSize: "12px", fontWeight: 700, color: "#2563eb" }}>
              İncele →
            </div>
          </Link>

          {/* Reviews Queue */}
          <Link
            href="/admin/reviews"
            style={{
              textDecoration: "none",
              background: pendingReviews > 0 ? "#fffbeb" : "var(--bg, #ffffff)",
              border: pendingReviews > 0 ? "2px solid #f59e0b" : "1px solid var(--border-light, #e2e8f0)",
              borderRadius: "14px",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                  ⭐ {t("queueReviews")}
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    color: pendingReviews > 0 ? "#b45309" : "#10b981",
                  }}
                >
                  {pendingReviews}
                </span>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: pendingReviews > 0 ? "#b45309" : "#64748b",
                  marginTop: "6px",
                }}
              >
                {pendingReviews > 0
                  ? t("queueReviewsPending", { count: pendingReviews })
                  : t("queueReviewsAllClear")}
              </div>
            </div>
            <div style={{ marginTop: "14px", fontSize: "12px", fontWeight: 700, color: "#2563eb" }}>
              Modere Et →
            </div>
          </Link>

          {/* Support Inquiries Queue */}
          <Link
            href="/admin/inquiries"
            style={{
              textDecoration: "none",
              background: openInquiries > 0 ? "#eff6ff" : "var(--bg, #ffffff)",
              border: openInquiries > 0 ? "2px solid #3b82f6" : "1px solid var(--border-light, #e2e8f0)",
              borderRadius: "14px",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                  💬 {t("queueInquiries")}
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    color: openInquiries > 0 ? "#2563eb" : "#10b981",
                  }}
                >
                  {openInquiries}
                </span>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: openInquiries > 0 ? "#2563eb" : "#64748b",
                  marginTop: "6px",
                }}
              >
                {openInquiries > 0
                  ? t("queueInquiriesPending", { count: openInquiries })
                  : t("queueInquiriesAllClear")}
              </div>
            </div>
            <div style={{ marginTop: "14px", fontSize: "12px", fontWeight: 700, color: "#2563eb" }}>
              Yanıtla →
            </div>
          </Link>

          {/* Upcoming Appointments */}
          <Link
            href="/admin/appointments"
            style={{
              textDecoration: "none",
              background: "var(--bg, #ffffff)",
              border: "1px solid var(--border-light, #e2e8f0)",
              borderRadius: "14px",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                  📅 {t("queueAppointments")}
                </span>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>
                  {upcomingAppointments}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>
                {t("queueAppointmentsCount", { count: upcomingAppointments })}
              </div>
            </div>
            <div style={{ marginTop: "14px", fontSize: "12px", fontWeight: 700, color: "#2563eb" }}>
              Yönet →
            </div>
          </Link>
        </div>
      </div>

      {/* SECTION 2: NETWORK SCALE METRICS */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <span style={{ fontSize: "18px" }}>🌐</span>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            {t("networkScale")}
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          <div
            style={{
              background: "var(--bg, #ffffff)",
              border: "1px solid var(--border-light, #e2e8f0)",
              borderRadius: "12px",
              padding: "16px 18px",
            }}
          >
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
              {t("statUsers")}
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {totalUsers}
            </div>
          </div>

          <div
            style={{
              background: "var(--bg, #ffffff)",
              border: "1px solid var(--border-light, #e2e8f0)",
              borderRadius: "12px",
              padding: "16px 18px",
            }}
          >
            <div style={{ fontSize: "12px", color: "#166534", fontWeight: 600 }}>
              {t("statVerifiedDoctors")}
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#15803d", marginTop: "4px" }}>
              {totalVerifiedDoctors}
            </div>
          </div>

          <div
            style={{
              background: "var(--bg, #ffffff)",
              border: "1px solid var(--border-light, #e2e8f0)",
              borderRadius: "12px",
              padding: "16px 18px",
            }}
          >
            <div style={{ fontSize: "12px", color: "#2563eb", fontWeight: 600 }}>
              {t("statDirectoryDoctors")}
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#1d4ed8", marginTop: "4px" }}>
              {totalDirectoryDoctors}
            </div>
          </div>

          <div
            style={{
              background: "var(--bg, #ffffff)",
              border: "1px solid var(--border-light, #e2e8f0)",
              borderRadius: "12px",
              padding: "16px 18px",
            }}
          >
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
              {t("statOrganizations")}
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {totalOrganizations}
            </div>
          </div>

          <div
            style={{
              background: "var(--bg, #ffffff)",
              border: "1px solid var(--border-light, #e2e8f0)",
              borderRadius: "12px",
              padding: "16px 18px",
            }}
          >
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
              {t("statAgencies")}
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {totalAgencies}
            </div>
          </div>

          <div
            style={{
              background: "var(--bg, #ffffff)",
              border: "1px solid var(--border-light, #e2e8f0)",
              borderRadius: "12px",
              padding: "16px 18px",
            }}
          >
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
              {t("statAppointments")}
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              {totalAppointments}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: QUICK ACCESS HUBS */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <span style={{ fontSize: "18px" }}>🗂️</span>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            {t("quickAccess")}
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "14px",
          }}
        >
          {/* Hub: Network */}
          <div
            style={{
              background: "var(--bg, #ffffff)",
              border: "1px solid var(--border-light, #e2e8f0)",
              borderRadius: "14px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                🏥 Sağlık Ağı & Dizin
              </div>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0" }}>
                {t("hubNetworkDesc")}
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <Link
                href="/admin/doctors"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  textDecoration: "none",
                }}
              >
                👨‍⚕️ Uzmanlar
              </Link>
              <Link
                href="/admin/organizations"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#f0fdf4",
                  color: "#166534",
                  textDecoration: "none",
                }}
              >
                🏥 Kurumlar
              </Link>
              <Link
                href="/admin/agencies"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#faf5ff",
                  color: "#7e22ce",
                  textDecoration: "none",
                }}
              >
                ✈️ Acenteler
              </Link>
              <Link
                href="/admin/users"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#f1f5f9",
                  color: "#334155",
                  textDecoration: "none",
                }}
              >
                👥 Kullanıcılar
              </Link>
            </div>
          </div>

          {/* Hub: Operations */}
          <div
            style={{
              background: "var(--bg, #ffffff)",
              border: "1px solid var(--border-light, #e2e8f0)",
              borderRadius: "14px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                ⚙️ Operasyon & Moderasyon
              </div>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0" }}>
                {t("hubOperationsDesc")}
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <Link
                href="/admin/appointments"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  textDecoration: "none",
                }}
              >
                📅 Randevular
              </Link>
              <Link
                href="/admin/reviews"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#fffbeb",
                  color: "#b45309",
                  textDecoration: "none",
                }}
              >
                ⭐ Değerlendirmeler
              </Link>
              <Link
                href="/admin/inquiries"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#f0fdf4",
                  color: "#166534",
                  textDecoration: "none",
                }}
              >
                💬 İletişim Talepleri
              </Link>
              <Link
                href="/admin/content"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#f1f5f9",
                  color: "#334155",
                  textDecoration: "none",
                }}
              >
                🎨 Banner & Kategori
              </Link>
            </div>
          </div>

          {/* Hub: System */}
          <div
            style={{
              background: "var(--bg, #ffffff)",
              border: "1px solid var(--border-light, #e2e8f0)",
              borderRadius: "14px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                🛡️ Sistem & Güvenlik
              </div>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0" }}>
                {t("hubSystemDesc")}
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <Link
                href="/admin/system"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  textDecoration: "none",
                }}
              >
                🛡️ Sistem Durumu & Audit
              </Link>
              <Link
                href="/admin/release"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#ecfdf5",
                  color: "#047857",
                  textDecoration: "none",
                }}
              >
                🚀 Go / No-Go Paneli
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: RECENT AUDIT PULSE */}
      <section
        style={{
          background: "var(--bg, #ffffff)",
          border: "1px solid var(--border-light, #e2e8f0)",
          borderRadius: "14px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>🛡️</span>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              {t("recentActivity")}
            </h2>
          </div>
          <Link
            href="/admin/system"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#2563eb",
              textDecoration: "none",
            }}
          >
            {t("viewAllLogs")} →
          </Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {recentLogs.map((log: any) => (
            <div
              key={log.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                borderRadius: "8px",
                background: "#f8fafc",
                fontSize: "13px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>{log.action}</span>
                <span
                  style={{
                    padding: "1px 6px",
                    borderRadius: "4px",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  {log.entityType}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <AdminStatusBadge status={log.outcome || "SUCCESS"} size="sm" />
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  {formatDateTime(log.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
