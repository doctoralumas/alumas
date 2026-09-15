"use client";
import { Suspense, useEffect, useState } from "react";
import SectionVisual from "@/components/section-visual";
import Link from "next/link";
import { scheduleLocalReminder } from "@/lib/local-reminders";
import { useSearchParams } from "next/navigation";
import { Syringe, Plus, X, CalendarBlank, Buildings, ShieldCheck, ShieldPlus, CaretRight, Info } from "@phosphor-icons/react";

type V={id:string;vaccineName:string;doseLabel?:string;administeredAt:string;provider?:string;nextDoseAt?:string};

export default function Page(){ 
  return (
    <Suspense fallback={<div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Yükleniyor...</div>}>
      <VaccinationsContent/>
    </Suspense>
  ); 
}

function VaccinationsContent(){
  const sp=useSearchParams();
  const profileId=sp.get("profileId")||"";
  
  const [rows,setRows]=useState<V[]>([]);
  const [open,setOpen]=useState(false);
  const [msg,setMsg]=useState('');
  const [loading, setLoading] = useState(true);

  const load=()=>fetch('/api/health/vaccinations'+(profileId?'?profileId='+encodeURIComponent(profileId):'')).then(r=>r.ok?r.json():[]).then(setRows).finally(()=>setLoading(false));
  useEffect(() => { load(); },[profileId]);

  async function add(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const r=await fetch('/api/health/vaccinations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...Object.fromEntries(f.entries()),specialProfileId:profileId||undefined})});
    const j=await r.json();
    if(!r.ok){
      setMsg(j.error||'Kaydedilemedi');
      return;
    }
    if(j.reminder){
      const native=await scheduleLocalReminder(j.reminder);
      setMsg(native.scheduled?'Aşı kaydı ve cihaz hatırlatıcısı oluşturuldu.':'Aşı kaydı ve Alumas hatırlatıcısı oluşturuldu.');
    }else {
      setMsg('Aşı kaydı başarıyla oluşturuldu.');
    }
    e.currentTarget.reset();
    setTimeout(() => { setOpen(false); setMsg(""); load(); }, 1500);
  }

  return (
    <div className="page" style={{ maxWidth: "1000px" }}>
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#ecfdf5", padding: "16px", borderRadius: "24px" }}>
            <Syringe size={32} weight="duotone" color="#059669" />
          </div>
          <div>
            <span className="kicker" style={{ color: "#059669" }}>Koruyucu Sağlık</span>
            <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "4px 0" }}>{profileId ? "Aile Profili Aşı Takibi" : "Aşı Takvimi"}</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>Uygulanan aşıları ve planlanan doz tarihlerini güvenle saklayın.</p>
          </div>
        </div>
        <button onClick={()=>setOpen(!open)} style={{ padding: "12px 24px", background: "#0f172a", color: "#fff", borderRadius: "100px", border: "none", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          {open ? <X size={20} /> : <Plus size={20} />} {open ? "İptal" : "Yeni Aşı Ekle"}
        </button>
      </div>

      {profileId && (
        <div style={{ background: "#fef3c7", color: "#d97706", padding: "16px 20px", borderRadius: "16px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px", border: "1px solid #fde68a" }}>
          <ShieldCheck size={24} weight="duotone" />
          <span style={{ fontSize: "14px", fontWeight: 600 }}>Bu ekrandaki yeni aşı kayıtları seçili aile profiline kaydedilecektir.</span>
        </div>
      )}

      {open && (
        <div style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", marginBottom: "40px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ background: "#f1f5f9", color: "#475569", padding: "8px", borderRadius: "12px" }}><ShieldPlus size={20} weight="bold" /></div>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Yeni Aşı Kaydı</h2>
          </div>
          
          <form onSubmit={add} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Aşı Adı <span style={{ color: "#ef4444" }}>*</span></label>
                <input name="vaccineName" required placeholder="Örn. Biontech, Tetanoz" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Doz Etiketi</label>
                <input name="doseLabel" placeholder="Örn. 2. Doz, Hatırlatma" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Uygulanan Kurum</label>
                <input name="provider" placeholder="Örn. Aile Hekimi, Hastane" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Uygulanma Tarihi <span style={{ color: "#ef4444" }}>*</span></label>
                <input name="administeredAt" type="date" required style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#475569" }} />
              </div>
              <div style={{ background: "#f0fdf4", border: "1px dashed #bbf7d0", padding: "16px", borderRadius: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#065f46", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <CalendarBlank size={16} /> Sonraki Doz Tarihi
                </label>
                <input name="nextDoseAt" type="date" style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #86efac", background: "#fff", outline: "none", fontSize: "15px", color: "#065f46" }} />
                <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#059669" }}>Girerseniz Alumas size hatırlatma gönderecektir.</p>
              </div>
            </div>

            <button style={{ padding: "16px", background: "#059669", color: "#fff", borderRadius: "16px", border: "none", fontWeight: 700, fontSize: "16px", cursor: "pointer", marginTop: "8px" }}>Kaydet</button>
            {msg && <div style={{ background: msg.includes('başarı')||msg.includes('oluşturuldu') ? '#ecfdf5' : '#fef2f2', color: msg.includes('başarı')||msg.includes('oluşturuldu') ? '#047857' : '#b91c1c', padding: "12px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, textAlign: "center" }}>{msg}</div>}
          </form>
        </div>
      )}

      {loading && <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Aşı kayıtları yükleniyor...</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", marginBottom: "48px" }}>
        {rows.map(v => (
          <div key={v.id} style={{ background: "#fff", borderRadius: "24px", padding: "24px", border: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
            
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669" }}>
                <Syringe size={24} weight="duotone" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: 700 }}>{v.vaccineName}</h3>
                <span style={{ fontSize: "14px", color: "#64748b", fontWeight: 500 }}>{v.doseLabel || 'Doz bilgisi yok'}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
              <div>
                <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#94a3b8", fontWeight: 600, marginBottom: "4px" }}>Uygulama</span>
                <span style={{ fontSize: "15px", color: "#0f172a", fontWeight: 600 }}>{new Date(v.administeredAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                  <Buildings size={14} /> {v.provider || 'Belirtilmedi'}
                </div>
              </div>

              <div style={{ background: v.nextDoseAt ? "#f0fdf4" : "#f8fafc", border: `1px solid ${v.nextDoseAt ? '#bbf7d0' : '#e2e8f0'}`, padding: "12px 16px", borderRadius: "16px" }}>
                <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: v.nextDoseAt ? "#059669" : "#94a3b8", fontWeight: 600, marginBottom: "4px" }}>Sonraki Doz</span>
                <span style={{ fontSize: "14px", color: v.nextDoseAt ? "#065f46" : "#64748b", fontWeight: v.nextDoseAt ? 700 : 500 }}>
                  {v.nextDoseAt ? new Date(v.nextDoseAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Planlanmadı'}
                </span>
              </div>
            </div>

          </div>
        ))}

        {!loading && rows.length === 0 && (
          <div style={{ padding: "64px", textAlign: "center", background: "#f8fafc", borderRadius: "32px", border: "1px dashed #cbd5e1" }}>
            <Syringe size={48} weight="duotone" color="#cbd5e1" style={{ marginBottom: "16px" }} />
            <div style={{ fontSize: "16px", color: "#64748b", fontWeight: 500 }}>Kayıtlı aşınız bulunmuyor.</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", background: "#f8fafc", padding: "16px", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
        <Info size={20} color="#64748b" style={{ flexShrink: 0, marginTop: "2px" }} />
        <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>
          Alumas kendi başına otomatik bir tıbbi aşı takvimi önermez; hatırlatmalar yalnızca sizin kaydettiğiniz manuel <b>Sonraki Doz Tarihine</b> göre cihazınıza gönderilir.
        </p>
      </div>

      <Link href="/health/summary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 600, color: "#0284c7", textDecoration: "none" }}>
        Sağlık Özetine Dön <CaretRight size={14} weight="bold" />
      </Link>
    </div>
  )
}
