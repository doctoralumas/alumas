"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Star, MapPin, Stethoscope, CaretRight, VideoCamera, ChatCircleText, MagnifyingGlass, Funnel } from "@phosphor-icons/react";

export default function DoctorClientList({ doctors, profileId }: { doctors: any[], profileId?: string }) {
  const [search, setSearch] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("");

  const getPresenceColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return { bg: '#dcfce7', text: '#16a34a', label: 'Müsait', dot: '#22c55e' };
      case 'ONLINE': return { bg: '#e0f2fe', text: '#0284c7', label: 'Çevrimiçi', dot: '#0ea5e9' };
      case 'BUSY': return { bg: '#fee2e2', text: '#dc2626', label: 'Meşgul', dot: '#ef4444' };
      default: return { bg: '#f1f5f9', text: '#64748b', label: 'Çevrimdışı', dot: '#94a3b8' };
    }
  };

  const specialties = useMemo(() => {
    const s = new Set(doctors.map(d => d.specialty));
    return Array.from(s).filter(Boolean).sort();
  }, [doctors]);

  const filtered = useMemo(() => {
    return doctors.filter(d => {
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.specialty.toLowerCase().includes(search.toLowerCase());
      const matchSpecialty = filterSpecialty ? d.specialty === filterSpecialty : true;
      return matchSearch && matchSpecialty;
    });
  }, [doctors, search, filterSpecialty]);

  return (
    <>
      <div style={{ display: "flex", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 300px", position: "relative" }}>
          <MagnifyingGlass size={20} color="#64748b" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Doktor, uzmanlık veya hastalık ara..." 
            style={{ width: "100%", padding: "16px 16px 16px 48px", borderRadius: "16px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", transition: "all 0.2s", background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}
            onFocus={e => e.target.style.borderColor = "#3b82f6"}
            onBlur={e => e.target.style.borderColor = "#cbd5e1"}
          />
        </div>
        
        <div style={{ flex: "0 0 auto", position: "relative" }}>
          <Funnel size={18} color="#64748b" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <select 
            value={filterSpecialty}
            onChange={e => setFilterSpecialty(e.target.value)}
            style={{ appearance: "none", padding: "16px 40px 16px 42px", borderRadius: "16px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", background: "#fff", color: filterSpecialty ? "#0f172a" : "#64748b", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}
          >
            <option value="">Tüm Uzmanlıklar</option>
            {specialties.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px", marginBottom: "48px" }}>
        {filtered.map(d => {
          const presence = getPresenceColor(d.presenceStatus);
          return (
            <Link key={d.id} href={`/doctors/${d.slug}${profileId ? `?profileId=${profileId}` : ''}`} style={{ background: "#fff", borderRadius: "24px", padding: "24px", border: "1px solid #e2e8f0", textDecoration: "none", color: "inherit", transition: "all 0.2s", display: "flex", flexDirection: "column", gap: "20px" }} className="hover-shadow">
              
              {/* Profil Header */}
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 700, color: "#475569", border: "1px solid #cbd5e1" }}>
                    {d.name.split(' ').slice(-2).map((x: string) => x[0]).join('')}
                  </div>
                  <div style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "16px", height: "16px", background: presence.dot, borderRadius: "50%", border: "3px solid #fff" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                    {d.name}
                  </h3>
                  <div style={{ color: "#4f46e5", fontSize: "14px", fontWeight: 600, marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Stethoscope size={16} /> {d.specialty}
                  </div>
                </div>
              </div>

              {/* Lokasyon ve Puan */}
              <div style={{ display: "flex", gap: "12px", background: "#f8fafc", padding: "12px", borderRadius: "16px" }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "13px", fontWeight: 500 }}>
                  <MapPin size={16} /> {d.city}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#f59e0b", fontSize: "13px", fontWeight: 700 }}>
                  <Star size={16} weight="fill" />
                  {d.reviewCount > 0 ? (
                    <>{d.rating.toFixed(1)} <span style={{ color: "#94a3b8", fontWeight: 500 }}>({d.reviewCount})</span></>
                  ) : (
                    <span style={{ color: "#64748b" }}>Yeni</span>
                  )}
                </div>
              </div>

              {/* Footer Aksiyonlar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", borderTop: "1px dashed #e2e8f0", paddingTop: "20px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}><VideoCamera size={18} /></div>
                  <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}><ChatCircleText size={18} /></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#0f172a", color: "#fff", padding: "10px 16px", borderRadius: "12px", fontSize: "14px", fontWeight: 600 }}>
                  Randevu <CaretRight size={14} weight="bold" />
                </div>
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1 / -1", padding: "64px", textAlign: "center", background: "#f8fafc", borderRadius: "24px", color: "#64748b", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <MagnifyingGlass size={48} color="#cbd5e1" weight="duotone" />
            <div>
              <strong style={{ display: "block", color: "#334155", fontSize: "18px", marginBottom: "4px" }}>Sonuç Bulunamadı</strong>
              Aradığınız kriterlere uygun uzman bulunmuyor. Farklı kelimelerle veya filtrelerle tekrar deneyin.
            </div>
          </div>
        )}
      </div>
    </>
  );
}

