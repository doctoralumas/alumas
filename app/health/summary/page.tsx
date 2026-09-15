"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import HealthSummarySharing from "@/components/health-summary-sharing";
import { Activity, ShieldCheck, Heartbeat, Drop, Pill, Users, CaretRight, Warning, Scissors, Syringe, Info, Scan } from "@phosphor-icons/react";

export default function Page(){
  const [d,setD]=useState<any>(null);
  
  useEffect(()=>{
    fetch('/api/health/summary').then(r=>r.ok?r.json():null).then(setD);
  },[]);

  if(!d) return (
    <div style={{ padding: "64px", textAlign: "center", color: "#64748b", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <Scan size={48} weight="duotone" color="#cbd5e1" className="spin-slow" />
      <div style={{ fontSize: "16px", fontWeight: 500 }}>Sağlık Özetiniz Yükleniyor...</div>
    </div>
  );

  return (
    <div className="page" style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "48px" }}>
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#f0fdfa", padding: "16px", borderRadius: "24px" }}>
            <Activity size={32} weight="duotone" color="#0d9488" />
          </div>
          <div>
            <span className="kicker" style={{ color: "#0d9488" }}>Tek Bakışta</span>
            <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "4px 0" }}>Sağlık Özeti</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>Alerjiler, aktif durumlar, ilaçlar, aşılar ve son ölçümlerinizin kısa özeti.</p>
          </div>
        </div>
      </div>

      {/* Hero Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "48px" }}>
        
        <div style={{ background: "#fef2f2", padding: "24px", borderRadius: "24px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ef4444", marginBottom: "16px" }}>
            <Heartbeat size={20} weight="fill" /> <span style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px" }}>Son Tansiyon</span>
          </div>
          <strong style={{ fontSize: "32px", fontWeight: 800, color: "#991b1b", lineHeight: 1 }}>{d.bp ? `${d.bp.systolic}/${d.bp.diastolic}` : '--'}</strong>
          <span style={{ fontSize: "14px", color: "#b91c1c", marginTop: "8px", fontWeight: 500 }}>{d.bp ? 'mmHg' : 'Kayıt yok'}</span>
        </div>

        <div style={{ background: "#fff7ed", padding: "24px", borderRadius: "24px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ea580c", marginBottom: "16px" }}>
            <Drop size={20} weight="fill" /> <span style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px" }}>Son Şeker</span>
          </div>
          <strong style={{ fontSize: "32px", fontWeight: 800, color: "#9a3412", lineHeight: 1 }}>{d.glucose ? d.glucose.value : '--'}</strong>
          <span style={{ fontSize: "14px", color: "#c2410c", marginTop: "8px", fontWeight: 500 }}>{d.glucose ? d.glucose.unit : 'Kayıt yok'}</span>
        </div>

        <div style={{ background: "#fdf2f8", padding: "24px", borderRadius: "24px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#db2777", marginBottom: "16px" }}>
            <Pill size={20} weight="fill" /> <span style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px" }}>Aktif İlaç</span>
          </div>
          <strong style={{ fontSize: "32px", fontWeight: 800, color: "#9d174d", lineHeight: 1 }}>{d.medications.length}</strong>
          <span style={{ fontSize: "14px", color: "#be185d", marginTop: "8px", fontWeight: 500 }}>kayıtlı tedavi</span>
        </div>

        <div style={{ background: "#e0f2fe", padding: "24px", borderRadius: "24px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0284c7", marginBottom: "16px" }}>
            <Users size={20} weight="fill" /> <span style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px" }}>Bağlı Profiller</span>
          </div>
          <strong style={{ fontSize: "32px", fontWeight: 800, color: "#075985", lineHeight: 1 }}>{d.profiles.length}</strong>
          <span style={{ fontSize: "14px", color: "#0369a1", marginTop: "8px", fontWeight: 500 }}>aile / çocuk hesabı</span>
        </div>

      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "32px", marginBottom: "48px" }}>
        
        {/* Alerjiler */}
        <section style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "#fef2f2", color: "#ef4444", padding: "8px", borderRadius: "12px" }}><Warning size={20} weight="fill" /></div>
              <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Alerjiler</h2>
            </div>
            <Link href="/health/allergies" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "14px", fontWeight: 600, color: "#0284c7", textDecoration: "none" }}>Tümü <CaretRight size={14}/></Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {d.allergies.map((x:any) => (
              <div key={x.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
                <div>
                  <b style={{ display: "block", fontSize: "15px", color: "#0f172a" }}>{x.allergen}</b>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>{x.reaction || 'Reaksiyon belirtilmedi'}</span>
                </div>
              </div>
            ))}
            {!d.allergies.length && <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "14px", background: "#f8fafc", borderRadius: "16px" }}>Aktif alerji kaydı yok.</div>}
          </div>
        </section>

        {/* Aktif Durumlar */}
        <section style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "#e0e7ff", color: "#4f46e5", padding: "8px", borderRadius: "12px" }}><Heartbeat size={20} weight="fill" /></div>
              <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Aktif Hastalıklar</h2>
            </div>
            <Link href="/health/medical-history" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "14px", fontWeight: 600, color: "#0284c7", textDecoration: "none" }}>Yönet <CaretRight size={14}/></Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {d.conditions.map((x:any) => (
              <div key={x.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
                <div>
                  <b style={{ display: "block", fontSize: "15px", color: "#0f172a" }}>{x.name}</b>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>{x.diagnosedAt ? new Date(x.diagnosedAt).toLocaleDateString('tr-TR') : 'Tarih yok'}</span>
                </div>
              </div>
            ))}
            {!d.conditions.length && <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "14px", background: "#f8fafc", borderRadius: "16px" }}>Aktif durum kaydı yok.</div>}
          </div>
        </section>

        {/* Son Aşılar */}
        <section style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "#ecfdf5", color: "#059669", padding: "8px", borderRadius: "12px" }}><Syringe size={20} weight="fill" /></div>
              <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Son Aşılar</h2>
            </div>
            <Link href="/health/vaccinations" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "14px", fontWeight: 600, color: "#0284c7", textDecoration: "none" }}>Tümü <CaretRight size={14}/></Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {d.vaccinations.slice(0,5).map((x:any) => (
              <div key={x.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
                <div>
                  <b style={{ display: "block", fontSize: "15px", color: "#0f172a" }}>{x.vaccineName}</b>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>{new Date(x.administeredAt).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            ))}
            {!d.vaccinations.length && <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "14px", background: "#f8fafc", borderRadius: "16px" }}>Aşı kaydı yok.</div>}
          </div>
        </section>

        {/* Önemli İşlemler */}
        <section style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "#f3e8ff", color: "#7e22ce", padding: "8px", borderRadius: "12px" }}><Scissors size={20} weight="fill" /></div>
              <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Önemli İşlemler</h2>
            </div>
            <Link href="/health/medical-history" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "14px", fontWeight: 600, color: "#0284c7", textDecoration: "none" }}>Geçmiş <CaretRight size={14}/></Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {d.procedures.slice(0,5).map((x:any) => (
              <div key={x.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
                <div>
                  <b style={{ display: "block", fontSize: "15px", color: "#0f172a" }}>{x.procedureName}</b>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>{new Date(x.performedAt).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            ))}
            {!d.procedures.length && <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "14px", background: "#f8fafc", borderRadius: "16px" }}>İşlem kaydı yok.</div>}
          </div>
        </section>

      </div>

      <div style={{ marginBottom: "32px" }}>
        <HealthSummarySharing />
      </div>

      <section style={{ background: "#f8fafc", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <ShieldCheck size={48} weight="duotone" color="#0ea5e9" style={{ marginBottom: "16px" }} />
        <h2 style={{ margin: "0 0 8px", fontSize: "20px", color: "#0f172a" }}>Acil Durum & Sağlık Kartı</h2>
        <p style={{ margin: "0 0 24px", fontSize: "15px", color: "#64748b", maxWidth: "600px" }}>Sağlık Kartı paylaşımı ayrı kontrol edilir. Bu ekran sadece sizin kişisel özetinizdir ve kartı otomatik olarak herkese açmaz.</p>
        <Link href="/health-card" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "12px 24px", background: "#0ea5e9", color: "#fff", borderRadius: "100px", textDecoration: "none", fontWeight: 700, fontSize: "15px", transition: "all 0.2s" }} className="hover-shadow">
          Sağlık Kartımı Yönet
        </Link>
      </section>

    </div>
  )
}
