import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DoctorAvailabilityManager from "@/components/doctor-availability-manager";
import CarePlanComposer from "@/components/care-plan-composer";
import DoctorOrganizationInvites from "@/components/doctor-organization-invites";
import DoctorCompletionList from "@/components/doctor-completion-list";
import CareCalendar from "@/components/care-calendar";
import ClinicalQuestions from "@/components/clinical-questions";
import DoctorPresence from "@/components/doctor-presence";
import DoctorProfileManager from "@/components/doctor-profile-manager";
import VerificationDocumentManager from "@/components/verification-document-manager";
import {
  ShieldCheck,
  Stethoscope,
  Clock,
  CalendarCheck,
  Users,
  ChatCircleText,
  Notepad,
  LockKey,
  MapPin,
} from "@phosphor-icons/react/dist/ssr";

export default async function DoctorDashboard() {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (u.role !== "DOCTOR" || !u.doctorProfile) redirect("/profile");

  const documents = await prisma.verificationDocument.findMany({
    where: { doctorId: u.doctorProfile.id },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: u.doctorProfile.id,
      startsAt: { gte: now },
      status: { not: "cancelled" },
    },
    select: {
      id: true,
      startsAt: true,
      type: true,
      visitCity: true,
      visitDistrict: true,
      visitAddress: true,
      user: { select: { id: true, name: true } },
    },
    orderBy: { startsAt: "asc" },
    take: 20,
  });

  const recentCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const completable = await prisma.appointment.findMany({
    where: {
      doctorId: u.doctorProfile.id,
      status: "confirmed",
      startsAt: { gte: recentCutoff, lte: now },
    },
    select: {
      id: true,
      startsAt: true,
      type: true,
      visitCity: true,
      visitDistrict: true,
      visitAddress: true,
      user: { select: { id: true, name: true } },
    },
    orderBy: { startsAt: "desc" },
    take: 20,
  });

  const patients = Array.from(
    new Map(
      appointments.map((a) => [a.user.id, { id: a.user.id, name: a.user.name }])
    ).values()
  );

  return (
    <div className="page workspace" style={{ maxWidth: "1200px" }}>
      <div className="page-title">
        <span
          className="kicker"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <ShieldCheck weight="fill" size={18} /> Alumas Pro
        </span>
        <h1>Uzman paneli</h1>
        <p style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Stethoscope size={18} /> {u.doctorProfile.specialty}
          <span style={{ color: "#cbd5e1" }}>•</span>
          <MapPin size={18} /> {u.doctorProfile.hospital}
        </p>
      </div>

      <section className="panel v25-presence-panel">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "#f0fdf4",
              color: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Clock size={24} weight="duotone" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
              Aktiflik durumum
            </h2>
            <p className="muted" style={{ margin: 0 }}>
              Hastaların seni çevrimiçi, müsait veya meşgul olarak görmesini
              yönet.
            </p>
          </div>
        </div>
        <DoctorPresence initial={u.doctorProfile.presenceStatus} />
      </section>

      <DoctorProfileManager profile={u.doctorProfile} />

      <VerificationDocumentManager
        owner={{ kind: "doctor", doctorId: u.doctorProfile.id }}
        documents={documents}
      />

      <DoctorOrganizationInvites />
      <ClinicalQuestions doctorMode />

      <div className="dashboard-grid">
        <section className="panel">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "#eff6ff",
                color: "#3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CalendarCheck size={24} weight="duotone" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                Müsaitlik takvimi
              </h2>
              <p className="muted" style={{ margin: 0 }}>
                Hastaların seçebileceği zaman aralıklarını aç.
              </p>
            </div>
          </div>
          <DoctorAvailabilityManager />
        </section>

        <section className="panel">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "#fef2f2",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={24} weight="duotone" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                Yaklaşan hastalar
              </h2>
              <p className="muted" style={{ margin: 0 }}>
                Onaylanmış yaklaşan randevularınız.
              </p>
            </div>
          </div>

          <div className="slot-list">
            {appointments.map((a) => (
              <div className="slot-row" key={a.id}>
                <div>
                  <b>{a.user.name}</b>
                  <span>
                    {new Date(a.startsAt).toLocaleString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {a.type === "home" && a.visitAddress
                      ? ` • ${[a.visitDistrict, a.visitAddress]
                          .filter(Boolean)
                          .join(", ")}`
                      : ""}
                  </span>
                </div>
                <span
                  className="status"
                  style={{
                    background:
                      a.type === "home"
                        ? "#fef2f2"
                        : a.type === "online"
                        ? "#eff6ff"
                        : "#f0fdf4",
                    color:
                      a.type === "home"
                        ? "#ef4444"
                        : a.type === "online"
                        ? "#3b82f6"
                        : "#16a34a",
                  }}
                >
                  {a.type === "home"
                    ? "Evde"
                    : a.type === "online"
                    ? "Online"
                    : "Klinik"}
                </span>
              </div>
            ))}
            {appointments.length === 0 && (
              <div className="empty">Yaklaşan randevu yok.</div>
            )}
          </div>
        </section>

        <section className="panel">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "#fff7ed",
                color: "#ea580c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChatCircleText size={24} weight="duotone" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                Tamamlanan görüşmeler
              </h2>
              <p className="muted" style={{ margin: 0 }}>
                Görüşme sonrası otomatik değerlendirme talepleri.
              </p>
            </div>
          </div>
          <DoctorCompletionList
            initial={completable.map((a) => ({
              id: a.id,
              patientName: a.user.name,
              startsAt: a.startsAt.toISOString(),
              type: a.type,
              visitDistrict: a.visitDistrict,
              visitAddress: a.visitAddress,
            }))}
          />
        </section>

        <section className="panel" style={{ gridRow: "span 2" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "#f3e8ff",
                color: "#9333ea",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Notepad size={24} weight="duotone" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                Bakım planı oluştur
              </h2>
              <p className="muted" style={{ margin: 0 }}>
                Hastalarınıza takip talimatı ve görev gönderin.
              </p>
            </div>
          </div>
          <CarePlanComposer patients={patients} />
          <div
            style={{
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <CareCalendar doctorMode patients={patients} />
          </div>
        </section>

        <section className="panel">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "#f1f5f9",
                color: "#475569",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LockKey size={24} weight="duotone" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                Paylaşılan sağlık kayıtları
              </h2>
              <p className="muted" style={{ margin: 0 }}>
                Hasta izinli verilere güvenli erişim sağlayın.
              </p>
            </div>
          </div>

          <div className="slot-list">
            {patients.map((p) => (
              <a
                className="slot-row"
                key={p.id}
                href={`/doctor/patients/${p.id}`}
                style={{ textDecoration: "none" }}
              >
                <div>
                  <b style={{ display: "block", color: "#0f172a" }}>{p.name}</b>
                  <span>İzinli kayıtları görüntüle</span>
                </div>
                <span style={{ color: "#3b82f6", fontWeight: 600 }}>→</span>
              </a>
            ))}
            {patients.length === 0 && (
              <div className="empty">Kayıtlı hasta yok.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
