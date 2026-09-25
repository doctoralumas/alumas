import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DoctorAvailabilityManager from "@/components/doctor-availability-manager";
import DoctorCompletionList from "@/components/doctor-completion-list";
import CarePlanComposer from "@/components/care-plan-composer";
import CareCalendar from "@/components/care-calendar";
import { Users, VideoCamera, ShieldCheck, MapPin, Notepad, CalendarCheck, ChatCircleText, LockKey } from "@phosphor-icons/react/dist/ssr";

export default async function DoctorDashboard() {
  const u = await currentUser();
  if (!u || u.role !== "DOCTOR" || !u.doctorProfile) return redirect("/pro/login");

  const now = new Date();
  
  const [appointments, completable, patients] = await Promise.all([
    prisma.appointment.findMany({
      where: { doctorId: u.doctorProfile.id, status: "confirmed", startsAt: { gte: now } },
      include: { user: true },
      orderBy: { startsAt: "asc" },
      take: 10
    }),
    prisma.appointment.findMany({
      where: { doctorId: u.doctorProfile.id, status: "confirmed", startsAt: { lt: now } },
      include: { user: true },
      orderBy: { startsAt: "desc" },
      take: 5
    }),
    prisma.user.findMany({
      where: { appointments: { some: { doctorId: u.doctorProfile.id } } },
      select: { id: true, name: true }
    })
  ]);

  return (
    <div className="page" style={{ maxWidth: "1100px" }}>
      <div className="page-title" style={{ marginBottom: "32px" }}>
        <span className="kicker">Uzman Paneli</span>
        <h1>Hoş Geldin, {u.name.split(" ")[0]}</h1>
        <p>Randevularını, hasta takiplerini ve ortak bakım planlarını yönet.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
        
        <section className="panel">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CalendarCheck size={24} weight="duotone" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Müsaitlik takvimi</h2>
              <p className="muted" style={{ margin: 0 }}>Hastaların seçebileceği zaman aralıklarını aç.</p>
            </div>
          </div>
          <DoctorAvailabilityManager />
        </section>

        <section className="panel" style={{ gridRow: "span 2", padding: "0" }}>
          <div style={{ padding: "24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", borderTopLeftRadius: "24px", borderTopRightRadius: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#f3e8ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Notepad size={24} weight="duotone" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Bakım planı oluştur</h2>
                <p style={{ color: "#64748b", fontSize: "14px", margin: "4px 0 0 0" }}>Hastalarınıza takip talimatı ve görev gönderin.</p>
              </div>
            </div>
          </div>
          
          <div style={{ padding: "24px" }}>
            <CarePlanComposer patients={patients} />
          </div>

          <div style={{ borderTop: "1px dashed #cbd5e1", padding: "24px" }}>
            <CareCalendar doctorMode embedded patients={patients} />
          </div>
        </section>

        <section className="panel">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#fef2f2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={24} weight="duotone" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Yaklaşan hastalar</h2>
              <p className="muted" style={{ margin: 0 }}>Onaylanmış yaklaşan randevularınız.</p>
            </div>
          </div>

          <div className="slot-list">
            {appointments.map((a) => (
              <div className="slot-row" key={a.id}>
                <div>
                  <b>{a.user.name}</b>
                  <span>
                    {new Date(a.startsAt).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    {a.type === "home" && a.visitAddress ? ` • ${[a.visitDistrict, a.visitAddress].filter(Boolean).join(", ")}` : ""}
                  </span>
                </div>
                <span className="status" style={{ background: a.type === "home" ? "#fef2f2" : a.type === "online" ? "#eff6ff" : "#f0fdf4", color: a.type === "home" ? "#ef4444" : a.type === "online" ? "#3b82f6" : "#16a34a" }}>
                  {a.type === "home" ? "Evde" : a.type === "online" ? "Online" : "Klinik"}
                </span>
              </div>
            ))}
            {appointments.length === 0 && <div className="empty">Yaklaşan randevu yok.</div>}
          </div>
        </section>

        <section className="panel">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#fff7ed", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChatCircleText size={24} weight="duotone" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Tamamlanan görüşmeler</h2>
              <p className="muted" style={{ margin: 0 }}>Görüşme sonrası otomatik değerlendirme talepleri.</p>
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

        <section className="panel">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#f1f5f9", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LockKey size={24} weight="duotone" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Paylaşılan sağlık kayıtları</h2>
              <p className="muted" style={{ margin: 0 }}>Hasta izinli verilere güvenli erişim sağlayın.</p>
            </div>
          </div>

          <div className="slot-list">
            {patients.map((p) => (
              <a className="slot-row" key={p.id} href={`/doctor/patients/${p.id}`} style={{ textDecoration: "none" }}>
                <div>
                  <b style={{ display: "block", color: "#0f172a" }}>{p.name}</b>
                  <span>İzinli kayıtları görüntüle</span>
                </div>
                <span style={{ color: "#3b82f6", fontWeight: 600 }}>→</span>
              </a>
            ))}
            {patients.length === 0 && <div className="empty">Kayıtlı hasta yok.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
