"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import SectionVisual from "@/components/section-visual";
import { User, Baby, Heartbeat, CalendarPlus, ShieldCheck, Syringe, Plus, CaretRight } from "@phosphor-icons/react";

type P={id:string;name:string;type:"CHILD"|"PREGNANCY";relationLabel?:string;birthDate?:string;dueDate?:string};

export default function Page(){
  const [profiles,setProfiles]=useState<P[]>([]);
  const [counts,setCounts]=useState<Record<string,number>>({});

  useEffect(()=>{
    fetch('/api/health/special-profiles').then(r=>r.ok?r.json():[]).then(async(ps:P[])=>{
      setProfiles(ps);
      const pairs=await Promise.all(ps.map(async p=>{
        const r=await fetch('/api/health/family-tasks?profileId='+p.id);
        const j=r.ok?await r.json():{};
        return [p.id,(j.appointments?.length||0)+(j.reminders?.length||0)+(j.pregnancyEvents?.length||0)] as const;
      }));
      setCounts(Object.fromEntries(pairs));
    })
  },[]);

  return (
    <div className="page">
      <SectionVisual slug="family" alt="Aile Sağlığı" />
      <div className="page-title">
        <span className="kicker">Alumas Family</span>
        <h1>Aile Sağlığı Paneli</h1>
        <p>Kendi profiliniz ile çocuk ve gebelik profillerinizin sağlık süreçlerini tek merkezden yönetin.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        
        {/* Kendi Profilim */}
        <Link href="/health/summary" style={{ display: "flex", flexDirection: "column", padding: "24px", background: "#f8fafc", borderRadius: "20px", border: "1px solid #e2e8f0", textDecoration: "none", transition: "all 0.2s" }} className="hover-shadow">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div style={{ padding: "12px", background: "#e0f2fe", borderRadius: "14px", color: "#0284c7" }}>
              <User size={28} weight="duotone" />
            </div>
            <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", background: "#f1f5f9", color: "#64748b", borderRadius: "12px" }}>Ana Profil</span>
          </div>
          <h3 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: "18px" }}>Benim Sağlığım</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "14px", lineHeight: "1.4" }}>Kişisel sağlık özetiniz, belgeleriniz ve paylaşımlarınız.</p>
        </Link>

        {/* Özel Profiller */}
        {profiles.map(p => (
          <Link key={p.id} href={`/health/family?profile=${p.id}`} style={{ display: "flex", flexDirection: "column", padding: "24px", background: "#fff", borderRadius: "20px", border: "1px solid #e2e8f0", textDecoration: "none", transition: "all 0.2s", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }} className="hover-shadow">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div style={{ padding: "12px", background: p.type === 'CHILD' ? "#dcfce7" : "#fce7f3", borderRadius: "14px", color: p.type === 'CHILD' ? "#16a34a" : "#db2777" }}>
                {p.type === 'CHILD' ? <Baby size={28} weight="duotone" /> : <Heartbeat size={28} weight="duotone" />}
              </div>
              <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", background: p.type === 'CHILD' ? "#f0fdf4" : "#fdf2f8", color: p.type === 'CHILD' ? "#15803d" : "#be185d", borderRadius: "12px" }}>
                {p.type === 'CHILD' ? 'Çocuk' : 'Gebelik'}
              </span>
            </div>
            <h3 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: "18px" }}>{p.name}</h3>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
              <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>{p.relationLabel || 'Aile üyesi'}</p>
              {(counts[p.id] || 0) > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#ea580c", background: "#ffedd5", padding: "4px 10px", borderRadius: "12px" }}>
                  <CalendarPlus size={14} /> {counts[p.id]} planlı
                </span>
              )}
            </div>
          </Link>
        ))}

        {/* Yeni Profil Ekle */}
        <Link href="/health/family-profiles" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", background: "#f8fafc", borderRadius: "20px", border: "2px dashed #cbd5e1", textDecoration: "none", transition: "all 0.2s" }}>
          <div style={{ padding: "12px", background: "#fff", borderRadius: "50%", color: "#64748b", marginBottom: "12px", border: "1px solid #e2e8f0" }}>
            <Plus size={24} />
          </div>
          <strong style={{ color: "#475569", fontSize: "16px" }}>Yeni Profil Ekle</strong>
          <small style={{ color: "#94a3b8", marginTop: "4px" }}>Çocuk veya gebelik</small>
        </Link>

      </div>

      <section className="panel" style={{ padding: "32px", borderRadius: "24px" }}>
        <h2 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "24px" }}>Hızlı İşlemler</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <Link href="/health/family" className="secondary compact" style={{ display: "flex", alignItems: "center", gap: "8px", borderRadius: "12px", padding: "12px 20px", fontSize: "15px", fontWeight: 600, border: "1px solid #e2e8f0" }}>
            <Heartbeat size={20} weight="duotone" color="#0284c7" /> Büyüme & Gebelik Takibi
          </Link>
          <Link href="/health/vaccinations" className="secondary compact" style={{ display: "flex", alignItems: "center", gap: "8px", borderRadius: "12px", padding: "12px 20px", fontSize: "15px", fontWeight: 600, border: "1px solid #e2e8f0" }}>
            <Syringe size={20} weight="duotone" color="#16a34a" /> Aşı Kayıtları
          </Link>
          <Link href="/calendar" className="secondary compact" style={{ display: "flex", alignItems: "center", gap: "8px", borderRadius: "12px", padding: "12px 20px", fontSize: "15px", fontWeight: 600, border: "1px solid #e2e8f0" }}>
            <CalendarPlus size={20} weight="duotone" color="#8b5cf6" /> Sağlık Takvimi
          </Link>
          <Link href="/health/family-access" className="secondary compact" style={{ display: "flex", alignItems: "center", gap: "8px", borderRadius: "12px", padding: "12px 20px", fontSize: "15px", fontWeight: 600, border: "1px solid #e2e8f0" }}>
            <ShieldCheck size={20} weight="duotone" color="#ea580c" /> Aile Erişimini Yönet
          </Link>
        </div>
      </section>
    </div>
  )
}
