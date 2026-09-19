"use client";
import SectionVisual from "@/components/section-visual";
import { useEffect, useState } from "react";
import { Stethoscope, Syringe, Drop, FirstAid, Wheelchair, MapPin, CalendarBlank, CaretRight, Info, CheckCircle } from "@phosphor-icons/react";
import Link from "next/link";

type R={id:string;serviceType:string;city:string;district?:string;status:string;preferredAt?:string};

const services=[
  { id: 'doctor', title: 'Evde Doktor Ziyareti', icon: Stethoscope },
  { id: 'nurse', title: 'Evde Hemşirelik', icon: Syringe },
  { id: 'blood', title: 'Kan / Numune Alma', icon: Drop },
  { id: 'dressing', title: 'Pansuman', icon: FirstAid },
  { id: 'physio', title: 'Fizyoterapi Desteği', icon: Wheelchair }
];

export default function Page(){
  const [rows,setRows]=useState<R[]>([]);
  const [msg,setMsg]=useState('');
  const [selectedService, setSelectedService] = useState(services[0].title);
  const [submitting, setSubmitting] = useState(false);
  
  const load=()=>fetch('/api/home-care').then(r=>r.json()).then(x=>setRows(Array.isArray(x)?x:[]));
  useEffect(() => { load(); },[]);
  
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    setSubmitting(true);
    setMsg('');
    const form=e.currentTarget;const f=new FormData(form);
    f.set('serviceType', selectedService);
    const b=Object.fromEntries(f.entries());
    
    try {
      const r=await fetch('/api/home-care',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
      setMsg(r.ok?'Talebiniz başarıyla alındı. Müşteri temsilcimiz en kısa sürede sizinle iletişime geçecektir.':'Talep oluşturulamadı. Lütfen tekrar deneyin.');
      if(r.ok) {
        load();
        form.reset();
      }
    } catch(err) {
      setMsg('Bir bağlantı hatası oluştu.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: "1000px" }}>
      <SectionVisual slug="home-care" alt="Evde Sağlık" />
      
      <div style={{ marginBottom: "40px" }}>
        <span className="kicker" style={{ color: "#0284c7" }}>Alumas Care</span>
        <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "8px 0" }}>Evde Sağlık Hizmetleri</h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "16px", maxWidth: "600px" }}>
          Evinizin konforunda profesyonel sağlık hizmeti alın. İhtiyacınız olan hizmeti seçin, uzman ekiplerimizi hemen yönlendirelim.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
        
        {/* Talep Formu */}
        <section style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.02)" }}>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            
            {/* Hizmet Seçimi Carousel/Pills */}
            <div>
              <label style={{ display: "block", marginBottom: "16px", fontWeight: 700, color: "#0f172a", fontSize: "18px" }}>Hangi hizmete ihtiyacınız var?</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                {services.map(s => {
                  const isSelected = selectedService === s.title;
                  return (
                    <button 
                      type="button" 
                      key={s.id}
                      onClick={() => setSelectedService(s.title)}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px", padding: "14px 20px", borderRadius: "16px",
                        border: isSelected ? "none" : "1px solid #cbd5e1",
                        background: isSelected ? "#0f172a" : "#f8fafc",
                        color: isSelected ? "#fff" : "#475569",
                        fontWeight: isSelected ? 600 : 500,
                        cursor: "pointer", transition: "all 0.2s"
                      }}
                    >
                      <s.icon size={22} weight={isSelected ? "duotone" : "regular"} />
                      {s.title}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>İl <span style={{ color: "#ef4444" }}>*</span></label>
                <input name="city" placeholder="Örn. İstanbul" required style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>İlçe <span style={{ color: "#ef4444" }}>*</span></label>
                <input name="district" placeholder="Örn. Kadıköy" required style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Randevu Tarihi (Opsiyonel)</label>
                <input name="preferredAt" type="datetime-local" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#475569" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Açık Adresiniz</label>
                <textarea name="addressNote" placeholder="Açık adres, apartman, daire ve yol tarifi detayları..." rows={4} style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", resize: "none", fontSize: "15px" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Hastanın Durumu / Notlarınız</label>
                <textarea name="note" placeholder="Sağlık ekibimize iletmek istediğiniz özel durumlar (Örn: Hastamız yatağa bağımlı, kan sulandırıcı kullanıyor...)" rows={4} style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", resize: "none", fontSize: "15px" }} />
              </div>
            </div>

            <button disabled={submitting} style={{ padding: "18px", background: "#0284c7", color: "#fff", borderRadius: "16px", border: "none", fontWeight: 700, fontSize: "16px", cursor: submitting ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Gönderiliyor...' : 'Talebi Gönder'}
              {!submitting && <CaretRight size={20} weight="bold" />}
            </button>
            
            {msg && (
              <div style={{ padding: "16px", borderRadius: "16px", background: msg.includes('başarıyla') ? '#ecfdf5' : '#fef2f2', color: msg.includes('başarıyla') ? '#047857' : '#b91c1c', display: "flex", alignItems: "center", gap: "8px", fontWeight: 500, fontSize: "14px" }}>
                {msg.includes('başarıyla') ? <CheckCircle size={20} weight="fill" /> : <Info size={20} weight="fill" />}
                {msg}
              </div>
            )}
          </form>
        </section>

        {/* Geçmiş Talepler */}
        {rows.length > 0 && (
          <section style={{ background: "#fff", borderRadius: "32px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "24px 32px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Geçmiş Hizmet Taleplerim</h2>
            </div>
            <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {rows.map(r=>(
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", background: "#f8fafc", borderRadius: "20px", border: "1px solid #e2e8f0", flexWrap: "wrap", gap: "16px" }}>
                  <div>
                    <strong style={{ display: "block", color: "#0f172a", fontSize: "16px", marginBottom: "8px" }}>{r.serviceType}</strong>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#64748b", fontWeight: 500 }}>
                        <MapPin size={16} /> {r.city}{r.district ? ` / ${r.district}` : ''}
                      </span>
                      {r.preferredAt && (
                        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#64748b", fontWeight: 500 }}>
                          <CalendarBlank size={16} /> {new Date(r.preferredAt).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <span style={{ padding: "8px 16px", borderRadius: "100px", fontSize: "13px", fontWeight: 700, 
                    background: r.status === 'PENDING' ? '#fef3c7' : r.status === 'MATCHED' ? '#dcfce7' : '#f1f5f9',
                    color: r.status === 'PENDING' ? '#d97706' : r.status === 'MATCHED' ? '#16a34a' : '#475569',
                    display: "flex", alignItems: "center", gap: "6px"
                  }}>
                    {r.status === 'PENDING' && <div style={{width:6,height:6,borderRadius:3,background:'#d97706'}}/>}
                    {r.status === 'MATCHED' && <div style={{width:6,height:6,borderRadius:3,background:'#16a34a'}}/>}
                    {r.status === 'PENDING' ? 'Değerlendiriliyor' : r.status === 'MATCHED' ? 'Ekipler Yönlendirildi' : r.status}
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
