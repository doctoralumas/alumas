"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import SectionVisual from "@/components/section-visual";
import { CalendarCheck, VideoCamera, FirstAid, CaretLeft, CheckCircle, XCircle, ClockCounterClockwise, Star } from "@phosphor-icons/react";

type Appointment={id:string;doctorId:string;doctorName:string;patientName?:string;specialty:string;startsAt:string;type:"online"|"clinic"|"home";status:string;specialProfile?:{id:string;name:string;type:string}|null;visitCity?:string|null;visitDistrict?:string|null;visitAddress?:string|null};
type Slot={id:string;startsAt:string;type:string};

export default function Appointments(){
  const [items,setItems]=useState<Appointment[]>([]);
  const [needsLogin,setNeedsLogin]=useState(false);
  const [editing,setEditing]=useState<string|null>(null);
  const [slots,setSlots]=useState<Slot[]>([]);
  const [newTime,setNewTime]=useState("");

  const load=()=>fetch('/api/appointments').then(async r=>{
    if(r.status===401){setNeedsLogin(true);return []}
    return r.ok?r.json():[]
  }).then(x=>Array.isArray(x)&&setItems(x));
  
  useEffect(()=>{load()},[]);

  async function cancel(id:string){
    if(!confirm('Bu randevuyu iptal etmek istiyor musun?'))return;
    await fetch(`/api/appointments/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'cancel'})});
    load();
  }

  async function openReschedule(a:Appointment){
    setEditing(a.id);
    setNewTime('');
    const r=await fetch(`/api/doctors/${a.doctorId}/availability`);
    const list=r.ok?await r.json():[];
    setSlots(a.type==="home"?list.filter((slot:Slot)=>slot.type==="home"):list.filter((slot:Slot)=>slot.type==="both"||slot.type===a.type));
  }

  async function reschedule(id:string){
    if(!newTime)return;
    const r=await fetch(`/api/appointments/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reschedule',startsAt:newTime})});
    if(r.ok){
      setEditing(null);
      load();
    }else{
      alert((await r.json()).error||'Erteleme başarısız');
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status){
      case 'confirmed': return <span style={{ background: "#dcfce7", color: "#16a34a", padding: "6px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle size={16}/> Onaylı</span>;
      case 'cancelled': return <span style={{ background: "#fee2e2", color: "#dc2626", padding: "6px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><XCircle size={16}/> İptal Edildi</span>;
      case 'completed': return <span style={{ background: "#f1f5f9", color: "#475569", padding: "6px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle size={16} weight="fill"/> Tamamlandı</span>;
      default: return <span style={{ background: "#fef3c7", color: "#d97706", padding: "6px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 600 }}>Değişti</span>;
    }
  }

  return (
    <div className="page" style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "32px" }}>
        <Link href="/services" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#64748b", textDecoration: "none", fontSize: "14px", fontWeight: 500, marginBottom: "16px" }}>
          <CaretLeft size={16} /> Tüm Hizmetlere Dön
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="kicker">Sağlık Planınız</span>
            <h1 style={{ fontSize: "28px", color: "#0f172a", margin: "8px 0" }}>Randevularım</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>Yaklaşan görüşmelerinizi erteleyin veya iptal edin. Tamamlanan görüşmeleri değerlendirin.</p>
          </div>
        </div>
      </div>

      {needsLogin ? (
        <div style={{ padding: "40px", textAlign: "center", background: "#f8fafc", borderRadius: "24px", border: "1px dashed #cbd5e1" }}>
          <p style={{ color: "#475569", fontSize: "16px", marginBottom: "16px" }}>Randevularınızı görmek için giriş yapmalısınız.</p>
          <Link href="/login" className="primary" style={{ padding: "12px 24px", borderRadius: "12px", textDecoration: "none" }}>Giriş Yap</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {items.map(a=>{
            const d=new Date(a.startsAt);
            return (
              <div key={a.id} style={{ background: "#fff", borderRadius: "24px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}>
                <div style={{ padding: "24px", display: "flex", gap: "24px", flexWrap: "wrap", opacity: a.status === 'cancelled' ? 0.6 : 1 }}>
                  
                  {/* Tarih Bloğu */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "16px 24px", borderRadius: "16px", minWidth: "90px" }}>
                    <strong style={{ fontSize: "28px", color: "#0f172a", lineHeight: "1" }}>{d.toLocaleDateString('tr-TR',{day:'2-digit'})}</strong>
                    <span style={{ fontSize: "14px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginTop: "4px" }}>{d.toLocaleDateString('tr-TR',{month:'short'})}</span>
                  </div>

                  {/* Detay Bloğu */}
                  <div style={{ flex: 1, minWidth: "250px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <strong style={{ fontSize: "20px", color: "#0f172a" }}>{a.doctorName}</strong>
                      {getStatusBadge(a.status)}
                    </div>
                    <p style={{ margin: "0 0 16px 0", color: "#475569", fontSize: "15px" }}>
                      {a.specialty}
                      {a.patientName ? ` • ${a.patientName}` : ''}
                      {a.specialProfile ? ` • ${a.specialProfile.type==='CHILD'?'Çocuk':'Gebelik'}: ${a.specialProfile.name}` : ''}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#64748b", background: "#f8fafc", padding: "6px 12px", borderRadius: "10px" }}>
                        <CalendarCheck size={18} weight="duotone" /> {d.toLocaleString('tr-TR',{weekday:'long',hour:'2-digit',minute:'2-digit'})}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: a.type==='online' ? "#4f46e5" : "#16a34a", background: a.type==='online' ? "#e0e7ff" : "#dcfce7", padding: "6px 12px", borderRadius: "10px", fontWeight: 500 }}>
                        {a.type==='online' ? <VideoCamera size={18} weight="duotone" /> : <FirstAid size={18} weight="duotone" />} 
                        {a.type==='home' ? 'Evde ziyaret' : a.type==='online' ? 'Online Görüşme' : 'Klinik Ziyareti'}
                      </span>
                      {a.type==='home' && a.visitAddress && (
                        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#64748b", background: "#f8fafc", padding: "6px 12px", borderRadius: "10px" }}>
                          {[a.visitDistrict, a.visitAddress].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Aksiyonlar */}
                {(a.status==='confirmed' || a.status==='completed') && (
                  <div style={{ padding: "16px 24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                    {a.status==='confirmed' && (
                      <>
                        <button onClick={()=>openReschedule(a)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }} className="hover-shadow">
                          <ClockCounterClockwise size={18} /> Ertele
                        </button>
                        <button onClick={()=>cancel(a.id)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "10px", border: "none", background: "#fee2e2", color: "#dc2626", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                          İptal Et
                        </button>
                      </>
                    )}
                    {a.status==='completed' && (
                      <Link href={`/doctors/${a.doctorId}#reviews`} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "10px", border: "none", background: "#fef3c7", color: "#d97706", fontWeight: 600, textDecoration: "none", transition: "all 0.2s" }}>
                        <Star size={18} weight="fill" /> Doktoru Değerlendir
                      </Link>
                    )}
                  </div>
                )}

                {/* Erteleme Formu */}
                {editing===a.id && (
                  <div style={{ padding: "24px", background: "#eff6ff", borderTop: "1px solid #bfdbfe" }}>
                    <h3 style={{ fontSize: "16px", color: "#1e3a8a", margin: "0 0 16px 0" }}>Yeni Bir Saat Belirleyin</h3>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <select value={newTime} onChange={e=>setNewTime(e.target.value)} style={{ flex: 1, minWidth: "200px", padding: "12px", borderRadius: "10px", border: "1px solid #bfdbfe" }}>
                        <option value="">Uygun Saat Seçin</option>
                        {slots.map(s=><option key={s.id} value={s.startsAt}>{new Date(s.startsAt).toLocaleString('tr-TR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}</option>)}
                        {!slots.length && <option value="" disabled>Seçilebilir uygun saat bulunamadı</option>}
                      </select>
                      <button onClick={()=>reschedule(a.id)} disabled={!newTime} style={{ padding: "12px 24px", borderRadius: "10px", border: "none", background: "#2563eb", color: "#fff", fontWeight: 600, cursor: newTime ? "pointer" : "not-allowed", opacity: newTime ? 1 : 0.5 }}>
                        Onayla
                      </button>
                      <button onClick={()=>setEditing(null)} style={{ padding: "12px 24px", borderRadius: "10px", border: "1px solid #93c5fd", background: "transparent", color: "#1e3a8a", fontWeight: 600, cursor: "pointer" }}>
                        Vazgeç
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          
          {items.length===0 && (
            <div style={{ padding: "48px", textAlign: "center", background: "#f8fafc", borderRadius: "24px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
              <CalendarCheck size={48} weight="duotone" color="#cbd5e1" style={{ margin: "0 auto 16px" }} />
              <h3 style={{ color: "#0f172a", fontSize: "18px", margin: "0 0 8px 0" }}>Randevunuz Bulunmuyor</h3>
              <p style={{ margin: 0, fontSize: "15px" }}>Şu an için planlanmış bir randevunuz veya görüşmeniz yok.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
