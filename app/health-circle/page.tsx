import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import Link from 'next/link';
import SectionVisual from "@/components/section-visual";
import { Stethoscope, Buildings, CalendarCheck, Heartbeat, CaretRight, Star, VideoCamera, FirstAid, CaretLeft } from "@phosphor-icons/react/dist/ssr";

export default async function HealthCircle(){
  const u=await currentUser();
  if(!u)redirect('/login');

  const [favDocs,favOrgs,appointments,plans]=await Promise.all([
    prisma.doctorFavorite.findMany({where:{userId:u.id},select:{id:true,doctor:{select:{slug:true,name:true,specialty:true,organization:{select:{name:true,slug:true}}}}},orderBy:{createdAt:'desc'}}),
    prisma.organizationFavorite.findMany({where:{userId:u.id},select:{id:true,organization:{select:{slug:true,name:true,city:true,district:true}}},orderBy:{createdAt:'desc'}}),
    prisma.appointment.findMany({where:{userId:u.id,status:{not:'cancelled'},startsAt:{gte:new Date()}},select:{id:true,startsAt:true,type:true,doctor:{select:{name:true,hospital:true}},organization:{select:{name:true}}},orderBy:{startsAt:'asc'},take:6}),
    prisma.carePlan.findMany({where:{patientId:u.id,status:'active'},select:{id:true,title:true,doctor:{select:{name:true}}},orderBy:{updatedAt:'desc'},take:6})
  ]);

  return (
    <div className="page" style={{ maxWidth: "1000px" }}>
      <SectionVisual slug="circle" alt="Sağlık Çevrem" />
      <div style={{ marginBottom: "32px" }}>
        <Link href="/services" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#64748b", textDecoration: "none", fontSize: "14px", fontWeight: 500, marginBottom: "16px" }}>
          <CaretLeft size={16} /> Tüm Hizmetlere Dön
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="kicker">Kişisel Ağınız</span>
            <h1 style={{ fontSize: "28px", color: "#0f172a", margin: "8px 0" }}>Sağlık Çevrem</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>Güvendiğiniz doktorları, kurumları ve aktif bakım planlarınızı buradan takip edin.</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        <div style={{ padding: "24px", background: "#f0f9ff", borderRadius: "20px", border: "1px solid #e0f2fe", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ padding: "16px", background: "#fff", borderRadius: "16px", color: "#0284c7", boxShadow: "0 4px 6px -1px rgba(2,132,199,0.1)" }}>
            <Stethoscope size={32} weight="duotone" />
          </div>
          <div>
            <span style={{ fontSize: "14px", color: "#0284c7", fontWeight: 600, display: "block", marginBottom: "4px" }}>Favori Doktor</span>
            <strong style={{ fontSize: "24px", color: "#0f172a", display: "block" }}>{favDocs.length}</strong>
          </div>
        </div>
        <div style={{ padding: "24px", background: "#fdf4ff", borderRadius: "20px", border: "1px solid #fae8ff", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ padding: "16px", background: "#fff", borderRadius: "16px", color: "#c026d3", boxShadow: "0 4px 6px -1px rgba(192,38,211,0.1)" }}>
            <Buildings size={32} weight="duotone" />
          </div>
          <div>
            <span style={{ fontSize: "14px", color: "#c026d3", fontWeight: 600, display: "block", marginBottom: "4px" }}>Favori Kurum</span>
            <strong style={{ fontSize: "24px", color: "#0f172a", display: "block" }}>{favOrgs.length}</strong>
          </div>
        </div>
        <div style={{ padding: "24px", background: "#f0fdf4", borderRadius: "20px", border: "1px solid #dcfce7", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ padding: "16px", background: "#fff", borderRadius: "16px", color: "#16a34a", boxShadow: "0 4px 6px -1px rgba(22,163,74,0.1)" }}>
            <CalendarCheck size={32} weight="duotone" />
          </div>
          <div>
            <span style={{ fontSize: "14px", color: "#16a34a", fontWeight: 600, display: "block", marginBottom: "4px" }}>Bekleyen Randevu</span>
            <strong style={{ fontSize: "24px", color: "#0f172a", display: "block" }}>{appointments.length}</strong>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px", marginBottom: "24px" }}>
        
        <section className="panel" style={{ padding: "32px", borderRadius: "24px", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ background: "#fef3c7", color: "#d97706", padding: "8px", borderRadius: "10px" }}><Star size={20} weight="fill" /></div>
            <h2 style={{ fontSize: "18px", color: "#0f172a", margin: 0 }}>Doktorlarım</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {favDocs.map(x=>(
              <Link href={`/doctors/${x.doctor.slug}`} key={x.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0", textDecoration: "none", transition: "all 0.2s" }} className="hover-shadow">
                <div>
                  <strong style={{ display: "block", fontSize: "16px", color: "#0f172a", marginBottom: "4px" }}>{x.doctor.name}</strong>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>{x.doctor.specialty}{x.doctor.organization ? ` • ${x.doctor.organization.name}` : ''}</span>
                </div>
                <CaretRight size={20} color="#94a3b8" />
              </Link>
            ))}
            {!favDocs.length && <div style={{ padding: "24px", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1", color: "#64748b" }}>Favori doktor eklediğinizde burada görünür.</div>}
          </div>
        </section>

        <section className="panel" style={{ padding: "32px", borderRadius: "24px", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ background: "#fef3c7", color: "#d97706", padding: "8px", borderRadius: "10px" }}><Star size={20} weight="fill" /></div>
            <h2 style={{ fontSize: "18px", color: "#0f172a", margin: 0 }}>Kurumlarım</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {favOrgs.map(x=>(
              <Link href={`/organizations/${x.organization.slug}`} key={x.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0", textDecoration: "none", transition: "all 0.2s" }} className="hover-shadow">
                <div>
                  <strong style={{ display: "block", fontSize: "16px", color: "#0f172a", marginBottom: "4px" }}>{x.organization.name}</strong>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>{x.organization.city}{x.organization.district ? ` • ${x.organization.district}` : ''}</span>
                </div>
                <CaretRight size={20} color="#94a3b8" />
              </Link>
            ))}
            {!favOrgs.length && <div style={{ padding: "24px", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1", color: "#64748b" }}>Favori kurum eklediğinizde burada görünür.</div>}
          </div>
        </section>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
        
        <section className="panel" style={{ padding: "32px", borderRadius: "24px", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ background: "#e0f2fe", color: "#0284c7", padding: "8px", borderRadius: "10px" }}><CalendarCheck size={20} weight="bold" /></div>
            <h2 style={{ fontSize: "18px", color: "#0f172a", margin: 0 }}>Yaklaşan Temaslar</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {appointments.map(a=>(
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "16px", color: "#0f172a", marginBottom: "4px" }}>{a.doctor.name}</strong>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>{a.organization?.name || a.doctor.hospital} • {a.startsAt.toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: a.type==='online' ? "#e0e7ff" : "#f1f5f9", color: a.type==='online' ? "#4f46e5" : "#475569", padding: "6px 12px", borderRadius: "12px", fontSize: "13px", fontWeight: 600 }}>
                  {a.type==='online' ? <VideoCamera size={16} /> : <FirstAid size={16} />}
                  {a.type==='online' ? 'Online' : 'Klinik'}
                </div>
              </div>
            ))}
            {!appointments.length && <div style={{ padding: "24px", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1", color: "#64748b" }}>Yaklaşan randevunuz bulunmuyor.</div>}
          </div>
        </section>

        <section className="panel" style={{ padding: "32px", borderRadius: "24px", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ background: "#fce7f3", color: "#db2777", padding: "8px", borderRadius: "10px" }}><Heartbeat size={20} weight="bold" /></div>
            <h2 style={{ fontSize: "18px", color: "#0f172a", margin: 0 }}>Aktif Bakım İlişkileri</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {plans.map(p=>(
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "16px", color: "#0f172a", marginBottom: "4px" }}>{p.doctor.name}</strong>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>{p.title}</span>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 600, background: "#dcfce7", color: "#16a34a", padding: "6px 12px", borderRadius: "12px" }}>Aktif İzlem</span>
              </div>
            ))}
            {!plans.length && <div style={{ padding: "24px", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1", color: "#64748b" }}>Aktif bir bakım planı bulunmuyor.</div>}
          </div>
        </section>
      </div>
    </div>
  )
}
