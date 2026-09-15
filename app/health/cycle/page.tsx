"use client";
import {useEffect,useMemo,useState} from "react";
import { Drop, CalendarBlank, Heart, Sparkles, Plus, Trash, Info, Activity, ClockCounterClockwise, CaretRight, Textbox } from "@phosphor-icons/react";

type R={id:string;startsAt:string;endsAt?:string|null;flow?:string|null;symptoms:string[];note?:string|null};
const fmt=(d:string)=>new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
const shortFmt=(d:string)=>new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

export default function Page(){
  const [rows,setRows]=useState<R[]>([]);
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(true);
  
  const load=()=>fetch('/api/health/cycle').then(r=>r.json()).then(x=>setRows(Array.isArray(x)?x:[])).finally(()=>setLoading(false));
  useEffect(()=>{load()},[]);

  const stats=useMemo(()=>{
    const sorted=[...rows].sort((a,b)=>+new Date(a.startsAt)-+new Date(b.startsAt));
    const diffs=sorted.slice(1).map((r,i)=>(+new Date(r.startsAt)-+new Date(sorted[i].startsAt))/86400000).filter(n=>n>=15&&n<=60);
    const avg=diffs.length?Math.round(diffs.reduce((a,b)=>a+b,0)/diffs.length):null;
    const last=sorted.at(-1);
    const next=avg&&last?new Date(+new Date(last.startsAt)+avg*86400000):null;
    return {avg,last,next}
  },[rows]);

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    setMessage("Kaydediliyor...");
    const form=e.currentTarget,f=new FormData(form);
    const res=await fetch('/api/health/cycle',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        startsAt:f.get('startsAt'),
        endsAt:f.get('endsAt')||null,
        flow:f.get('flow')||null,
        symptoms:String(f.get('symptoms')||'').split(',').map(x=>x.trim()).filter(Boolean),
        note:f.get('note')||null
      })
    });
    const x=await res.json();
    if(!res.ok){
      setMessage(x.error||'Kayıt eklenemedi');
      return;
    }
    form.reset();
    setMessage('Kayıt başarıyla eklendi.');
    setTimeout(() => setMessage(''), 3000);
    load();
  }

  async function remove(id:string){
    if(!confirm('Bu döngü kaydı silinsin mi?')) return;
    const r=await fetch('/api/health/cycle?id='+encodeURIComponent(id),{method:'DELETE'});
    if(r.ok) load();
  }

  return (
    <div className="page" style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "48px" }}>
      
      {/* Header */}
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#fdf2f8", padding: "16px", borderRadius: "24px" }}>
            <Drop size={32} weight="duotone" color="#db2777" />
          </div>
          <div>
            <span className="kicker" style={{ color: "#db2777" }}>Kadın Sağlığı</span>
            <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "4px 0" }}>Regl Takibi</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>Döngü tarihlerini, belirtileri ve kişisel notlarını kaydet, otomatik tahminleri gör.</p>
          </div>
        </div>
      </div>

      {/* İstatistikler */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px", marginBottom: "32px" }}>
        
        <div style={{ background: "#fff", padding: "24px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#db2777", marginBottom: "16px" }}>
            <CalendarBlank size={20} weight="fill" /> <span style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px" }}>Son Başlangıç</span>
          </div>
          <strong style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{stats.last?shortFmt(stats.last.startsAt):'--'}</strong>
          <span style={{ fontSize: "14px", color: "#64748b", marginTop: "8px", fontWeight: 500 }}>kayıtlı son döngü</span>
        </div>

        <div style={{ background: "#fff", padding: "24px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0ea5e9", marginBottom: "16px" }}>
            <Activity size={20} weight="fill" /> <span style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px" }}>Ortalama Döngü</span>
          </div>
          <strong style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{stats.avg?`${stats.avg} `:'--'} <small style={{ fontSize: "16px", color: "#64748b", fontWeight: 600 }}>gün</small></strong>
          <span style={{ fontSize: "14px", color: "#64748b", marginTop: "8px", fontWeight: 500 }}>geçmiş verilere göre</span>
        </div>

        <div style={{ background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)", padding: "24px", borderRadius: "24px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#db2777", marginBottom: "16px" }}>
            <Sparkles size={20} weight="fill" /> <span style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px" }}>Tahmini Sonraki</span>
          </div>
          <strong style={{ fontSize: "28px", fontWeight: 800, color: "#9d174d", lineHeight: 1 }}>{stats.next?shortFmt(stats.next.toISOString()):'--'}</strong>
          <span style={{ fontSize: "14px", color: "#be185d", marginTop: "8px", fontWeight: 500 }}>beklenen regl tarihi</span>
        </div>

      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", background: "#f8fafc", padding: "16px", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: "40px" }}>
        <Info size={20} color="#64748b" style={{ flexShrink: 0, marginTop: "2px" }} />
        <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>
          Tahmini sonraki başlangıç tarihi yalnızca geçmiş kayıtlarınızın ortalamasına dayalı kişisel planlama bilgisidir; doğum kontrolü, gebelik değerlendirmesi, tanı veya tedavi amacıyla kullanılmamalıdır.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "start" }}>
        
        {/* Form Alanı */}
        <div style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
          <h2 style={{ margin: "0 0 24px", fontSize: "20px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
            <Plus size={24} weight="duotone" color="#db2777" /> Yeni Kayıt Ekle
          </h2>
          
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "150px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Başlangıç <span style={{ color: "#ef4444" }}>*</span></label>
                <input name="startsAt" type="date" required style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a" }} />
              </div>
              <div style={{ flex: 1, minWidth: "150px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Bitiş</label>
                <input name="endsAt" type="date" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a" }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Akış Yoğunluğu</label>
              <select name="flow" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a", appearance: "none" }}>
                <option value="">Seçiniz</option>
                <option>Hafif</option>
                <option>Orta</option>
                <option>Yoğun</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Belirtiler</label>
              <input name="symptoms" placeholder="Kramp, baş ağrısı, şişkinlik, yorgunluk..." style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Not</label>
              <textarea name="note" placeholder="Özel notunuz..." rows={2} style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a", resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px" }}>
              <button type="submit" style={{ flex: 1, padding: "16px", background: "#0f172a", color: "#fff", borderRadius: "16px", border: "none", fontWeight: 700, fontSize: "16px", cursor: "pointer", transition: "background 0.2s" }} className="hover-shadow">
                Kaydet
              </button>
            </div>
            {message && <div style={{ background: message.includes('başarı') ? '#f0fdf4' : '#fef2f2', color: message.includes('başarı') ? '#16a34a' : '#ef4444', padding: "12px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, textAlign: "center" }}>{message}</div>}
          </form>
        </div>

        {/* Geçmiş Kayıtlar */}
        <section style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ background: "#f1f5f9", color: "#475569", padding: "8px", borderRadius: "12px" }}><ClockCounterClockwise size={20} weight="fill" /></div>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Geçmiş Döngüler</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {rows.map(r => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px", background: "#f8fafc", borderRadius: "20px", border: "1px solid #f1f5f9" }}>
                <div>
                  <b style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", color: "#0f172a", marginBottom: "8px" }}>
                    <CalendarBlank size={18} color="#db2777" /> 
                    {shortFmt(r.startsAt)} {r.endsAt ? <><CaretRight size={14} color="#94a3b8" /> {shortFmt(r.endsAt)}</> : ''}
                  </b>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {r.flow && <span style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}><Drop size={14} /> Akış: {r.flow}</span>}
                    {r.symptoms?.length > 0 && <span style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}><Heart size={14} /> {r.symptoms.join(', ')}</span>}
                    {r.note && <span style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}><Textbox size={14} /> {r.note}</span>}
                  </div>
                </div>
                
                <button 
                  onClick={() => remove(r.id)}
                  style={{ width: "36px", height: "36px", borderRadius: "12px", background: "#fee2e2", border: "none", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
                  title="Sil"
                >
                  <Trash size={16} weight="bold" />
                </button>
              </div>
            ))}
            
            {!loading && rows.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: "16px" }}>Henüz bir döngü kaydınız yok.</div>
            )}
            {loading && <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>Yükleniyor...</div>}
          </div>
        </section>

      </div>
    </div>
  )
}
