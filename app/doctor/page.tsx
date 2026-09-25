import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DoctorAvailabilityManager from "@/components/doctor-availability-manager";
import DoctorCompletionList from "@/components/doctor-completion-list";
import CarePlanComposer from "@/components/care-plan-composer";
import CareCalendar from "@/components/care-calendar";
import { Users, ShieldCheck, MapPin, Notepad, CalendarCheck, ChatCircleText, LockKey, VideoCamera, Storefront, FirstAidKit, CaretRight, User, CalendarBlank } from "@phosphor-icons/react/dist/ssr";

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "online": return <VideoCamera size={16} weight="fill" />;
      case "clinic": return <Storefront size={16} weight="fill" />;
      case "home": return <FirstAidKit size={16} weight="fill" />;
      default: return <MapPin size={16} weight="fill" />;
    }
  };

  return (
    <div className="page" style={{ maxWidth: "1100px" }}>
      <div className="page-title" style={{ marginBottom: "32px" }}>
        <span className="kicker">Uzman Paneli</span>
        <h1>Hoş Geldin, {u.name.split(" ")[0]}</h1>
        <p>Randevularını, hasta takiplerini ve ortak bakım planlarını yönet.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
        
        <section className="panel" style={{ padding: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CalendarCheck size={28} weight="duotone" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "19px", fontWeight: 700, color: "#0f172a" }}>Müsaitlik takvimi</h2>
              <p style={{ color: "#64748b", fontSize: "14px", margin: "4px 0 0 0" }}>Hastaların seçebileceği zaman aralıklarını aç.</p>
            </div>
          </div>
          <DoctorAvailabilityManager />
        </section>

        <section className="panel" style={{ gridRow: "span 3", padding: "0" }}>
          <div style={{ padding: "32px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", borderTopLeftRadius: "24px", borderTopRightRadius: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#f3e8ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Notepad size={28} weight="duotone" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "19px", fontWeight: 700, color: "#0f172a" }}>Bakım planı oluştur</h2>
                <p style={{ color: "#64748b", fontSize: "14px", margin: "4px 0 0 0" }}>Hastalarınıza takip talimatı ve görev gönderin.</p>
              </div>
            </div>
          </div>
          
          <div style={{ padding: "32px" }}>
            <CarePlanComposer patients={patients} />
          </div>

          <div style={{ borderTop: "1px dashed #cbd5e1", padding: "32px" }}>
            <CareCalendar doctorMode embedded patients={patients} />
          </div>
        </section>

        <section className="panel" style={{ padding: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#fef2f2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={28} weight="duotone" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "19px", fontWeight: 700, color: "#0f172a" }}>Yaklaşan hastalar</h2>
              <p style={{ color: "#64748b", fontSize: "14px", margin: "4px 0 0 0" }}>Onaylanmış yaklaşan randevularınız.</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {appointments.map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", transition: "all 0.2s" }} className="hover-shadow">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f8fafc", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <User size={20} weight="duotone" />
                  </div>
                  <div>
                    <b style={{ display: "block", color: "#0f172a", fontSize: "15px", marginBottom: "4px" }}>{a.user.name}</b>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#64748b" }}>
                      <span style={{ fontWeight: 600, color: "#475569" }}>
                        {new Date(a.startsAt).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", background: a.type === "home" ? "#fef2f2" : a.type === "online" ? "#eff6ff" : "#f0fdf4", color: a.type === "home" ? "#ef4444" : a.type === "online" ? "#3b82f6" : "#16a34a", borderRadius: "6px", fontWeight: 500 }}>
                        {getTypeIcon(a.type)}
                        {a.type === "home" ? "Evde" : a.type === "online" ? "Online" : "Klinik"}
                      </span>
                      {a.type === "home" && a.visitAddress && (
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          • <MapPin size={12} weight="bold" /> {[a.visitDistrict, a.visitAddress].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {appointments.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                <CalendarBlank size={32} weight="duotone" style={{ margin: "0 auto 12px" }} color="#cbd5e1" />
                <p style={{ margin: 0, fontSize: "14px" }}>Yaklaşan randevu yok.</p>
              </div>
            )}
          </div>
        </section>

        <section className="panel" style={{ padding: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#fff7ed", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChatCircleText size={28} weight="duotone" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "19px", fontWeight: 700, color: "#0f172a" }}>Tamamlanan görüşmeler</h2>
              <p style={{ color: "#64748b", fontSize: "14px", margin: "4px 0 0 0" }}>Görüşme sonrası otomatik değerlendirme talepleri.</p>
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

        <section className="panel" style={{ padding: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#f1f5f9", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LockKey size={28} weight="duotone" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "19px", fontWeight: 700, color: "#0f172a" }}>Paylaşılan sağlık kayıtları</h2>
              <p style={{ color: "#64748b", fontSize: "14px", margin: "4px 0 0 0" }}>Hasta izinli verilere güvenli erişim sağlayın.</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {patients.map((p) => (
              <a key={p.id} href={`/doctor/patients/${p.id}`} style={{ textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", transition: "all 0.2s" }} className="hover-shadow">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f8fafc", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <User size={20} weight="duotone" />
                  </div>
                  <div>
                    <b style={{ display: "block", color: "#0f172a", fontSize: "15px", marginBottom: "4px" }}>{p.name}</b>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>İzinli kayıtları görüntüle</span>
                  </div>
                </div>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CaretRight size={16} weight="bold" />
                </div>
              </a>
            ))}
            {patients.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                <Users size={32} weight="duotone" style={{ margin: "0 auto 12px" }} color="#cbd5e1" />
                <p style={{ margin: 0, fontSize: "14px" }}>Kayıtlı hasta yok.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
