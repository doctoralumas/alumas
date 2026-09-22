"use client";
import {useEffect,useState} from "react";
import InteractiveOrganizationMap from '@/components/interactive-organization-map';
import { MagnifyingGlass, NavigationArrow, MapTrifold, Buildings, Crosshair, Pill, Prescription, FirstAid, CaretRight, Star, ShieldCheck, Moon, TestTube } from "@phosphor-icons/react";
import Link from "next/link";

type Named={id:string;name:string};
type Org={id:string;slug:string;type:"HOSPITAL"|"CLINIC"|"PHARMACY"|"IMAGING_CENTER"|"LABORATORY";name:string;city:string;district?:string|null;address:string;phone:string;description?:string|null;latitude?:number|null;longitude?:number|null;distanceKm?:number|null;rating?:number|null;isOnDuty?:boolean;onDutyUntil?:string|null;_count?:{doctors:number;reviews:number};services?:Named[];imagingExams?:Named[];laboratoryTests?:Named[]};

const labels:any = { HOSPITAL:"Hastane", CLINIC:"Klinik", PHARMACY:"Eczane", IMAGING_CENTER:"Görüntüleme Merkezi", LABORATORY:"Tıbbi Laboratuvar" };

export default function OrganizationDirectory({ isLoggedIn = false }: { isLoggedIn?: boolean }){
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const [rows,setRows] = useState<Org[]>([]);
  const [type,setType] = useState("");
  const [q,setQ] = useState("");
  const [view,setView] = useState<'list'|'map'>('list');
  const [pos,setPos] = useState<{lat:number;lng:number}|null>(null);
  const [onDuty,setOnDuty] = useState(false);
  const [geoMsg,setGeoMsg] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(nextPos=pos){
    setLoading(true);
    const p=new URLSearchParams();
    if(type)p.set("type",type);
    if(q)p.set("q",q);
    if(onDuty)p.set('onDuty','1');
    if(nextPos){p.set('lat',String(nextPos.lat));p.set('lng',String(nextPos.lng))}
    
    try {
      const r=await fetch(`/api/organizations?${p}`);
      setRows(r.ok?await r.json():[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{load()},[type,onDuty]);

  function nearby(){
    if (!isLoggedIn) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if(!navigator.geolocation){
      setGeoMsg('Konum bu cihazda kullanılamıyor.');
      return;
    }
    setGeoMsg('Konum alınıyor...');
    navigator.geolocation.getCurrentPosition(p=>{
      const n={lat:p.coords.latitude,lng:p.coords.longitude};
      setPos(n);
      setGeoMsg('Yakınlığa göre sıralandı.');
      load(n);
    },()=>setGeoMsg('Konum izni verilmedi.'))
  }

  const getOrgStyling = (orgType: string, isDuty: boolean) => {
    if(isDuty) return { bg: '#fff7ed', text: '#ea580c', icon: <Moon size={24} weight="duotone" /> };
    switch (orgType) {
      case 'HOSPITAL': return { bg: '#e0f2fe', text: '#0284c7', icon: <Buildings size={24} weight="duotone" /> };
      case 'CLINIC': return { bg: '#dcfce7', text: '#16a34a', icon: <FirstAid size={24} weight="duotone" /> };
      case 'PHARMACY': return { bg: '#fef3c7', text: '#d97706', icon: <Pill size={24} weight="duotone" /> };
      case 'IMAGING_CENTER': return { bg: '#f3e8ff', text: '#9333ea', icon: <Prescription size={24} weight="duotone" /> };
      case 'LABORATORY': return { bg: '#ccfbf1', text: '#0f766e', icon: <TestTube size={24} weight="duotone" /> };
      default: return { bg: '#f1f5f9', text: '#64748b', icon: <Buildings size={24} weight="duotone" /> };
    }
  };

  return (
    <>
      {/* Search & Actions */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap", background: "#fff", padding: "16px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
        <div style={{ flex: 1, minWidth: "250px", position: "relative", display: "flex", alignItems: "center" }}>
          <MagnifyingGlass size={20} color="#94a3b8" style={{ position: "absolute", left: "16px" }} />
          <input 
            value={q} 
            onChange={e=>setQ(e.target.value)} 
            onKeyDown={e=>{if(e.key==='Enter')load()}} 
            placeholder="Kurum, tetkik, tahlil, il veya ilçe ara..."
            style={{ width: "100%", padding: "14px 16px 14px 44px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }}
          />
        </div>
        <button onClick={()=>load()} style={{ padding: "0 24px", background: "#0f172a", color: "#fff", borderRadius: "16px", border: "none", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center" }}>Ara</button>
        <button onClick={nearby} style={{ padding: "0 20px", background: "#f8fafc", color: "#0f172a", borderRadius: "16px", border: "1px solid #cbd5e1", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}><Crosshair size={20} weight="bold" /> Yakınımdakiler</button>
        <button onClick={()=>setView(view==='list'?'map':'list')} style={{ padding: "0 20px", background: "#f8fafc", color: "#0f172a", borderRadius: "16px", border: "1px solid #cbd5e1", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <MapTrifold size={20} weight="bold" /> {view==='list' ? 'Haritada Gör' : 'Listeye Dön'}
        </button>
      </div>
      
      {geoMsg && <div style={{ marginBottom: "24px", padding: "12px 16px", background: "#e0f2fe", color: "#0284c7", borderRadius: "12px", fontSize: "14px", fontWeight: 500 }}>{geoMsg}</div>}

      {/* Filter Pills */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "32px", overflowX: "auto", paddingBottom: "8px" }}>
        {[
          { id: "", label: "Tümü" },
          { id: "HOSPITAL", label: "Hastane" },
          { id: "CLINIC", label: "Klinik" },
          { id: "PHARMACY", label: "Eczane" },
          { id: "IMAGING_CENTER", label: "Görüntüleme Merkezi" },
          { id: "LABORATORY", label: "Tıbbi Laboratuvar" }
        ].map(x => {
          const isSelected = type === x.id && !onDuty;
          return (
            <button 
              key={x.id} 
              onClick={()=>{setOnDuty(false);setType(x.id)}}
              style={{ padding: "10px 20px", borderRadius: "100px", border: isSelected ? "none" : "1px solid #cbd5e1", background: isSelected ? "#0f172a" : "#f8fafc", color: isSelected ? "#fff" : "#475569", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s" }}
            >
              {x.label}
            </button>
          )
        })}
        <button 
          onClick={()=>{setType('PHARMACY');setOnDuty(true)}}
          style={{ padding: "10px 20px", borderRadius: "100px", border: onDuty ? "none" : "1px solid #fed7aa", background: onDuty ? "#ea580c" : "#fff7ed", color: onDuty ? "#fff" : "#ea580c", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
        >
          <Moon size={18} weight="fill" /> Nöbetçi Eczane
        </button>
      </div>

      {view === 'list' ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px", marginBottom: "48px" }}>
          {rows.map(o => {
            const style = getOrgStyling(o.type, !!o.isOnDuty && o.type === "PHARMACY");
            const preview = (o.type === "IMAGING_CENTER" ? o.imagingExams : o.type === "LABORATORY" ? o.laboratoryTests : o.type === "PHARMACY" ? [] : o.services)?.map((item) => item.name).slice(0, 3) || [];
            return (
              <div key={o.id} style={{ background: "#fff", borderRadius: "24px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", transition: "all 0.2s", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }} className="hover-shadow">
                <div style={{ padding: "24px", display: "flex", gap: "16px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: style.bg, color: style.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {style.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: style.text }}>{labels[o.type]}</span>
                      {o.type === "PHARMACY" && o.isOnDuty && <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", background: "#ea580c", color: "#fff", borderRadius: "100px" }}>NÖBETÇİ</span>}
                    </div>
                    <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: 700, lineHeight: "1.4" }}>
                      <Link href={`/organizations/${o.slug}`} style={{ color: "inherit", textDecoration: "none" }}>{o.name}</Link>
                    </h3>
                  </div>
                </div>
                
                <div style={{ padding: "20px 24px", flex: 1, display: "flex", flexDirection: "column", gap: "12px", background: "#f8fafc" }}>
                  <div style={{ fontSize: "14px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                    <NavigationArrow size={16} /> {o.city}{o.district ? `, ${o.district}` : ""} {o.distanceKm != null ? `• ${o.distanceKm.toFixed(1)} km` : ""}
                  </div>
                  <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>{o.address}</p>
                  {preview.length > 0 && <div style={{ fontSize: "13px", color: "#334155", lineHeight: "1.45" }}>{preview.join(" · ")}</div>}
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 600, color: "#16a34a" }}>
                      <ShieldCheck size={18} weight="fill" /> Doğrulanmış
                    </div>
                    {o.rating != null && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 700, color: "#f59e0b" }}>
                        <Star size={16} weight="fill" /> {o.rating.toFixed(1)} ({o._count?.reviews || 0})
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ padding: "16px 24px", background: "#fff", borderTop: "1px solid #f1f5f9", display: "flex", gap: "12px" }}>
                  {o.latitude != null && o.longitude != null && (
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${o.latitude},${o.longitude}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#0f172a", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: 600, fontSize: "14px" }}>
                      Yol Tarifi <NavigationArrow size={16} weight="bold" />
                    </a>
                  )}
                  <Link href={`/organizations/${o.slug}`} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#0f172a", color: "#fff", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: 600, fontSize: "14px" }}>
                    İncele <CaretRight size={16} weight="bold" />
                  </Link>
                </div>
              </div>
            );
          })}
          {!loading && rows.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: "64px", textAlign: "center", background: "#f8fafc", borderRadius: "24px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
              Bu kriterlere uygun sağlık kurumu bulunamadı.
            </div>
          )}
        </div>
      ) : (
        <div style={{ height: "600px", borderRadius: "24px", overflow: "hidden", border: "1px solid #e2e8f0", marginBottom: "48px" }}>
          <InteractiveOrganizationMap rows={rows} token={token} />
        </div>
      )}
    </>
  );
}
