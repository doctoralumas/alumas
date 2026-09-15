"use client";
import {useEffect,useMemo,useState} from "react";
import {scheduleLocalReminder} from "@/lib/local-reminders";
import { Calendar, Bell, Plus, X, CaretLeft, CaretRight, User, Stethoscope, Target, Question, Syringe, Baby, Heartbeat, Pill, Drop, Moon, FirstAid } from "@phosphor-icons/react";

const iso=(d:Date)=>d.toISOString().slice(0,10);
const labels=['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];

export default function ReminderCalendar(){
  const [date,setDate]=useState(iso(new Date()));
  const [data,setData]=useState<any>({appointments:[],reminders:[],careEvents:[],goals:[],questions:[],labComments:[],diagnostics:[],vaccinations:[],pregnancyEvents:[]});
  const [all,setAll]=useState<any[]>([]);
  const [open,setOpen]=useState(false);
  const [msg,setMsg]=useState('');
  const [loading, setLoading]=useState(true);

  const load=()=>{
    setLoading(true);
    fetch(`/api/calendar?date=${date}`).then(r=>r.ok?r.json():{appointments:[],reminders:[],careEvents:[],goals:[],questions:[],labComments:[],diagnostics:[],vaccinations:[],pregnancyEvents:[]}).then(setData).finally(()=>setLoading(false));
    fetch('/api/reminders').then(r=>r.ok?r.json():[]).then(setAll);
  };
  useEffect(()=>{load()},[date]);

  const days=useMemo(()=>{
    const d=new Date(date+'T12:00:00');
    return Array.from({length:7},(_,i)=>{
      const x=new Date(d);
      x.setDate(d.getDate()+i-3);
      return x;
    });
  },[date]);

  async function add(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const body={title:f.get('title'),kind:f.get('kind'),timeOfDay:f.get('timeOfDay'),weekdays:[0,1,2,3,4,5,6]};
    const r=await fetch('/api/reminders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();
    if(!r.ok){
      setMsg(j.error||'Kaydedilemedi');
      return;
    }
    const native=await scheduleLocalReminder(j);
    setMsg(native.scheduled?'Hatırlatıcı kaydedildi ve cihaz alarmı planlandı.':'Hatırlatıcı kaydedildi. Cihaz bildirimi açık.');
    setTimeout(() => { setOpen(false); setMsg(""); load(); }, 1500);
  }

  async function toggle(id:string,enabled:boolean){
    await fetch('/api/reminders',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,enabled})});
    load();
  }

  const shiftDate = (daysCount: number) => {
    const d = new Date(date+'T12:00:00');
    d.setDate(d.getDate() + daysCount);
    setDate(iso(d));
  };

  const getEventIcon = (type: string, kind?: string) => {
    if(type.includes('Randevu')) return <User size={24} weight="duotone" color="#2563eb" />;
    if(type.includes('Tetkik')) return <FirstAid size={24} weight="duotone" color="#ef4444" />;
    if(type.includes('Aşı')) return <Syringe size={24} weight="duotone" color="#10b981" />;
    if(type.includes('Hedef')) return <Target size={24} weight="duotone" color="#d97706" />;
    if(type.includes('Soru') || type.includes('Doktor')) return <Stethoscope size={24} weight="duotone" color="#8b5cf6" />;
    if(type.includes('Gebelik')) return <Baby size={24} weight="duotone" color="#ec4899" />;
    
    // Hatırlatıcı kinds
    if(kind === 'BLOOD_PRESSURE') return <Heartbeat size={24} weight="duotone" color="#ef4444" />;
    if(kind === 'GLUCOSE') return <Drop size={24} weight="duotone" color="#f59e0b" />;
    if(kind === 'MEDICATION') return <Pill size={24} weight="duotone" color="#db2777" />;
    if(kind === 'SLEEP') return <Moon size={24} weight="duotone" color="#6366f1" />;
    
    return <Bell size={24} weight="duotone" color="#64748b" />;
  };

  const events=[
    ...(data.reminders||[]).filter((r:any)=>r.kind!=='VACCINATION').map((r:any)=>({time:r.timeOfDay,title:r.title,type:'Hatırlatıcı',kind:r.kind})),
    ...(data.appointments||[]).map((a:any)=>({time:new Date(a.startsAt).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}),title:a.doctor?.name||'Randevu',type:'Randevu'})),
    ...(data.careEvents||[]).map((x:any)=>({time:new Date(x.startsAt).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}),title:x.title,type:'Bakım Görevi'})),
    ...(data.goals||[]).map((g:any)=>({time:'12:00',title:`Hedef: ${g.title}`,type:'Hedef'})),
    ...(data.questions||[]).map((q:any)=>({time:new Date(q.answeredAt||q.createdAt).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}),title:q.answeredAt?`Yanıt: ${q.subject}`:`Soru: ${q.subject}`,type:'Doktor Sorusu'})),
    ...(data.labComments||[]).map((c:any)=>({time:new Date(c.createdAt).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}),title:`${c.labResult?.testName}: doktor yorumu`,type:'Laboratuvar'})),
    ...(data.diagnostics||[]).map((d:any)=>({time:'12:00',title:`Tetkik: ${d.title}`,type:'Tetkik İsteği'})),
    ...(data.vaccinations||[]).map((v:any)=>({time:'09:00',title:`Aşı: ${v.vaccineName}${v.doseLabel?' • '+v.doseLabel:''}`,type:'Aşı Hatırlatması'})),
    ...(data.pregnancyEvents||[]).map((x:any)=>({time:new Date(x.startsAt).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}),title:x.title,type:`Gebelik • ${x.profile?.name||'Takvim'}`}))
  ].sort((a,b)=>a.time.localeCompare(b.time));

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "48px" }}>
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#e0e7ff", padding: "16px", borderRadius: "24px" }}>
            <Calendar size={32} weight="duotone" color="#4f46e5" />
          </div>
          <div>
            <span className="kicker" style={{ color: "#4f46e5" }}>Zaman Planlaması</span>
            <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "4px 0" }}>Sağlık Takvimi</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>Randevu, alarm, görev ve takiplerin tek ekranda gün bazlı görünümü.</p>
          </div>
        </div>
        <button onClick={()=>setOpen(!open)} style={{ padding: "12px 24px", background: "#0f172a", color: "#fff", borderRadius: "100px", border: "none", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          {open ? <X size={20} /> : <Plus size={20} />} {open ? "İptal" : "Alarm Kur"}
        </button>
      </div>

      {open && (
        <form onSubmit={add} style={{ background: "#fff", padding: "32px", borderRadius: "32px", border: "1px solid #e2e8f0", marginBottom: "40px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Hatırlatıcı Başlığı <span style={{ color: "#ef4444" }}>*</span></label>
              <input name="title" required placeholder="Örn. Tansiyon Ölçümü" defaultValue="Tansiyon Ölçümü" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Kategori</label>
              <select name="kind" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }}>
                <option value="BLOOD_PRESSURE">Tansiyon</option>
                <option value="GLUCOSE">Kan Şekeri</option>
                <option value="MEDICATION">İlaç</option>
                <option value="SLEEP">Uyku</option>
                <option value="WATER">Su İçme</option>
                <option value="VACCINATION">Aşı</option>
                <option value="PREGNANCY">Gebelik</option>
                <option value="CUSTOM">Diğer</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Zamanı <span style={{ color: "#ef4444" }}>*</span></label>
              <input name="timeOfDay" type="time" required defaultValue="09:00" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#475569" }} />
            </div>
          </div>
          <button style={{ padding: "16px", background: "#4f46e5", color: "#fff", borderRadius: "16px", border: "none", fontWeight: 700, fontSize: "16px", cursor: "pointer", marginTop: "20px" }}>Alarmı Oluştur</button>
          {msg && <div style={{ background: msg.includes('başarı')||msg.includes('kaydedildi') ? '#e0e7ff' : '#fef2f2', color: msg.includes('başarı')||msg.includes('kaydedildi') ? '#4338ca' : '#b91c1c', padding: "12px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, textAlign: "center", marginTop: "16px" }}>{msg}</div>}
        </form>
      )}

      {/* Haftalık Şerit Takvim */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px", background: "#fff", padding: "16px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
        <button onClick={() => shiftDate(-1)} style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#f1f5f9", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", cursor: "pointer", flexShrink: 0 }}><CaretLeft size={20} weight="bold" /></button>
        
        <div style={{ display: "flex", flex: 1, justifyContent: "space-between", overflowX: "auto", gap: "8px", paddingBottom: "4px" }}>
          {days.map(d => {
            const isSelected = iso(d) === date;
            return (
              <button 
                key={iso(d)} 
                onClick={() => setDate(iso(d))}
                style={{ 
                  flex: 1, minWidth: "56px", padding: "12px 0", borderRadius: "16px", border: "none", 
                  background: isSelected ? "#0f172a" : "transparent", 
                  color: isSelected ? "#fff" : "#64748b",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer", transition: "all 0.2s"
                }}
              >
                <span style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>{labels[d.getDay()]}</span>
                <b style={{ fontSize: "20px", fontWeight: 800 }}>{d.getDate()}</b>
              </button>
            )
          })}
        </div>

        <button onClick={() => shiftDate(1)} style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#f1f5f9", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", cursor: "pointer", flexShrink: 0 }}><CaretRight size={20} weight="bold" /></button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "32px", marginBottom: "48px" }}>
        
        {/* Günlük Ajanda */}
        <section style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
          <h2 style={{ margin: "0 0 24px", fontSize: "20px", color: "#0f172a" }}>
            {new Date(date+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})} Planı
          </h2>
          
          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Ajanda yükleniyor...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {events.map((x:any, i:number) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "16px", background: "#f8fafc", padding: "16px", borderRadius: "20px", border: "1px solid #f1f5f9" }}>
                  <div style={{ minWidth: "64px", fontSize: "16px", fontWeight: 800, color: "#4f46e5", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    {x.time}
                  </div>
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {getEventIcon(x.type, x.kind)}
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "16px", color: "#0f172a", fontWeight: 700 }}>{x.title}</h3>
                    <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>{x.type}</span>
                  </div>
                </div>
              ))}
              {!events.length && (
                <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: "16px" }}>Bu gün için planlı aktiviteniz bulunmuyor.</div>
              )}
            </div>
          )}
        </section>

        {/* Kurulmuş Tüm Alarmlar */}
        <section style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ background: "#f1f5f9", color: "#475569", padding: "8px", borderRadius: "12px" }}><Bell size={20} weight="fill" /></div>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Tüm Hatırlatıcılar / Alarmlar</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {all.map(r => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: r.enabled ? "#fff" : "#f8fafc", borderRadius: "20px", border: "1px solid #e2e8f0", opacity: r.enabled ? 1 : 0.6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: r.enabled ? "#e0e7ff" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {getEventIcon('Hatırlatıcı', r.kind)}
                  </div>
                  <div>
                    <b style={{ display: "block", fontSize: "16px", color: "#0f172a", textDecoration: r.enabled ? 'none' : 'line-through' }}>{r.title}</b>
                    <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>{r.timeOfDay} • {r.kind}</span>
                  </div>
                </div>
                
                <button 
                  onClick={()=>toggle(r.id, !r.enabled)}
                  style={{ width: "48px", height: "26px", borderRadius: "100px", background: r.enabled ? "#4f46e5" : "#cbd5e1", border: "none", position: "relative", cursor: "pointer", transition: "background 0.3s", flexShrink: 0 }}
                >
                  <div style={{ width: "22px", height: "22px", background: "#fff", borderRadius: "50%", position: "absolute", top: "2px", left: r.enabled ? "24px" : "2px", transition: "left 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                </button>
              </div>
            ))}
            {all.length === 0 && (
               <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: "16px" }}>Kurulu alarmınız yok.</div>
            )}
          </div>
        </section>

      </div>

    </div>
  )
}
