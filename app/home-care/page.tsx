"use client";
import SectionVisual from "@/components/section-visual";
import { useEffect, useState } from "react";
import { Stethoscope, Syringe, Drop, FirstAid, Wheelchair, MapPin, CalendarBlank } from "@phosphor-icons/react";

type R={id:string;serviceType:string;city:string;district?:string;status:string;preferredAt?:string};

const services=[
  { id: 'doctor', title: 'Evde doktor ziyareti', icon: Stethoscope },
  { id: 'nurse', title: 'Evde hemşirelik', icon: Syringe },
  { id: 'blood', title: 'Kan / numune alma', icon: Drop },
  { id: 'dressing', title: 'Pansuman', icon: FirstAid },
  { id: 'physio', title: 'Fizyoterapi desteği', icon: Wheelchair }
];

export default function Page(){
  const [rows,setRows]=useState<R[]>([]);
  const [msg,setMsg]=useState('');
  const [selectedService, setSelectedService] = useState(services[0].title);
  
  const load=()=>fetch('/api/home-care').then(r=>r.json()).then(x=>setRows(Array.isArray(x)?x:[]));
  useEffect(() => { load(); },[]);
  
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    f.set('serviceType', selectedService);
    const b=Object.fromEntries(f.entries());
    const r=await fetch('/api/home-care',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
    setMsg(r.ok?'Talep alındı. Sizinle en kısa sürede iletişime geçeceğiz.':'Talep oluşturulamadı');
    if(r.ok) {
      load();
      e.currentTarget.reset();
    }
  }

  return (
    <div className="page">
      <SectionVisual slug="home-care" alt="Evde sağlık"/>
      <div className="page-title">
        <span className="kicker">Alumas Care</span>
        <h1>Evde Sağlık</h1>
        <p>Evinizin konforunda profesyonel sağlık hizmeti alın. İhtiyacınız olan hizmeti seçin, uzman ekiplerimizi yönlendirelim.</p>
      </div>

      <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "1fr", maxWidth: "800px" }}>
        <form className="panel" onSubmit={submit} style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div>
            <label style={{ display: "block", marginBottom: "12px", fontWeight: 600, color: "#123f6b", fontSize: "16px" }}>İhtiyacınız olan hizmet</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {services.map(s => (
                <button 
                  type="button" 
                  key={s.id}
                  onClick={() => setSelectedService(s.title)}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", borderRadius: "12px",
                    border: selectedService === s.title ? "2px solid var(--primary, #123f6b)" : "1px solid rgba(18,63,107,0.15)",
                    background: selectedService === s.title ? "rgba(18,63,107,0.05)" : "#fff",
                    color: selectedService === s.title ? "var(--primary, #123f6b)" : "#64748b",
                    fontWeight: selectedService === s.title ? 600 : 500,
                    cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  <s.icon size={20} weight={selectedService === s.title ? "duotone" : "regular"} />
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "6px" }}>Şehir <span className="text-red">*</span></label>
              <input name="city" placeholder="Örn. İstanbul" required style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "6px" }}>İlçe</label>
              <input name="district" placeholder="Örn. Kadıköy" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "6px" }}>Tercih Edilen Tarih & Saat (İsteğe bağlı)</label>
            <input name="preferredAt" type="datetime-local" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", color: "#475569" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "6px" }}>Açık Adres</label>
              <textarea name="addressNote" placeholder="Açık adresiniz ve yol tarifi..." rows={3} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "none" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "6px" }}>Hizmet Notu</label>
              <textarea name="note" placeholder="Sağlık ekibine iletmek istediğiniz özel durumlar (Örn: Hastamız yatağa bağımlı)" rows={3} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "none" }} />
            </div>
          </div>

          <button className="primary" style={{ padding: "16px", fontSize: "16px", marginTop: "8px", borderRadius: "12px" }}>Talebi Gönder</button>
          
          {msg && (
            <div style={{ padding: "16px", borderRadius: "8px", background: msg.includes('alındı') ? '#ecfdf5' : '#fef2f2', color: msg.includes('alındı') ? '#047857' : '#b91c1c', textAlign: "center", fontWeight: 500 }}>
              {msg}
            </div>
          )}
        </form>

        {rows.length > 0 && (
          <section className="panel" style={{ padding: "24px" }}>
            <h2 style={{ marginBottom: "16px", fontSize: "18px", color: "#123f6b" }}>Geçmiş Taleplerim</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {rows.map(r=>(
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div>
                    <strong style={{ display: "block", color: "#123f6b", marginBottom: "4px" }}>{r.serviceType}</strong>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#64748b" }}>
                      <MapPin size={14} /> {r.city}{r.district ? ` / ${r.district}` : ''}
                      {r.preferredAt && <><CalendarBlank size={14} style={{marginLeft: "8px"}} /> {new Date(r.preferredAt).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</>}
                    </span>
                  </div>
                  <span style={{ padding: "6px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 600, 
                    background: r.status === 'PENDING' ? '#fef3c7' : r.status === 'MATCHED' ? '#d1fae5' : '#e2e8f0',
                    color: r.status === 'PENDING' ? '#b45309' : r.status === 'MATCHED' ? '#047857' : '#475569'
                  }}>
                    {r.status === 'PENDING' ? 'Değerlendiriliyor' : r.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
