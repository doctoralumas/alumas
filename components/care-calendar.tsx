"use client";
import { useEffect, useState } from "react";
import { Plus, CheckCircle, Circle, Ruler, Pill, User, TestTube, Heartbeat, CalendarCheck } from "@phosphor-icons/react";

type CareItem = {
  id: string;
  carePlanId: string | null;
  patientId: string;
  doctorId: string;
  kind: string;
  title: string;
  instructions: string | null;
  startsAt: string;
  completedAt: string | null;
  patient?: { name: string };
  doctor?: { name: string };
  carePlan?: { title: string };
};

export default function CareCalendar({ doctorMode, patients = [], embedded = false }: { doctorMode?: boolean, patients?: any[], embedded?: boolean }) {
  const [rows, setRows] = useState<CareItem[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  const qs = doctorMode ? '?doctorMode=1' : '';

  const load = () => {
    fetch('/api/care-calendar' + qs).then(r => r.ok ? r.json() : []).then(setRows);
    if (!doctorMode) {
      fetch('/api/care-plans').then(r => r.ok ? r.json() : []).then(setPlans);
    }
  };

  useEffect(() => { load() }, []);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const body = Object.fromEntries(f.entries());

    const r = await fetch('/api/care-calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (r.ok) {
      setMsg({ type: 'success', text: 'Görev takvime eklendi.' });
      form.reset();
      load();
    } else {
      const j = await r.json();
      setMsg({ type: 'error', text: j.error || 'Eklenemedi' });
    }
  }

  async function done(id: string, completed: boolean) {
    await fetch('/api/care-calendar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed })
    });
    load();
  }

  const getIcon = (kind: string) => {
    switch(kind) {
      case 'measurement': return <Ruler size={24} weight="duotone" color="#0284c7" />;
      case 'medication': return <Pill size={24} weight="duotone" color="#16a34a" />;
      case 'visit': return <User size={24} weight="duotone" color="#8b5cf6" />;
      case 'test': return <TestTube size={24} weight="duotone" color="#ea580c" />;
      default: return <Heartbeat size={24} weight="duotone" color="#db2777" />;
    }
  };

  const getLabel = (kind: string) => {
    switch(kind) {
      case 'measurement': return 'Ölçüm';
      case 'medication': return 'İlaç';
      case 'visit': return 'Kontrol';
      case 'test': return 'Tetkik';
      default: return 'Diğer';
    }
  };

  // Determine if we should wrap in the big panel or not
  const formContent = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div style={{ background: "#e0f2fe", color: "#0284c7", padding: "10px", borderRadius: "12px" }}>
          <CalendarCheck size={24} weight="duotone" />
        </div>
        <div>
          <h2 style={{ fontSize: "20px", color: "#0f172a", margin: 0 }}>Ortak Bakım Takvimi</h2>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748b", marginTop: "4px" }}>Doktor ve hastanın eş zamanlı görebildiği ortak takip planı.</p>
        </div>
      </div>

      <form onSubmit={add} style={{ display: "flex", flexDirection: "column", gap: "16px", background: embedded ? "transparent" : "#f8fafc", padding: embedded ? "0" : "24px", borderRadius: embedded ? "0" : "16px", border: embedded ? "none" : "1px solid #e2e8f0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {doctorMode ? (
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Hasta Seçimi *</label>
              <select name="patientId" required style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", background: "#fff" }}>
                <option value="">Hasta seçin</option>
                {patients.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>İlgili Bakım Planı *</label>
              <select name="carePlanId" required style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", background: "#fff" }}>
                <option value="">Plan seçin</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                {!plans.length && <option value="">Aktif plan bulunamadı</option>}
              </select>
            </div>
          )}
          
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Tarih / Saat *</label>
            <input name="startsAt" type="datetime-local" required style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none" }} />
          </div>
          
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Görev Türü</label>
            <select name="kind" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", background: "#fff" }}>
              <option value="measurement">Ölçüm</option>
              <option value="medication">İlaç</option>
              <option value="visit">Kontrol</option>
              <option value="test">Tetkik</option>
              <option value="care">Diğer</option>
            </select>
          </div>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: embedded ? "1fr" : "2fr 1fr", gap: "16px", alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Görev Başlığı *</label>
            <input name="title" placeholder="Örn: Sabah tansiyon ölçümü" required style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none" }} />
          </div>
          <button type="submit" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "12px", borderRadius: "10px", height: "43px", background: "#0284c7", color: "white", border: "none", fontWeight: 600, cursor: "pointer" }}>
            <Plus size={18} weight="bold" /> Ekle
          </button>
        </div>

        {msg.text && (
          <div style={{ padding: "12px 16px", borderRadius: "10px", background: msg.type === 'success' ? '#ecfdf5' : '#fef2f2', color: msg.type === 'success' ? '#047857' : '#b91c1c', fontSize: "14px", fontWeight: 500, marginTop: "8px" }}>
            {msg.text}
          </div>
        )}
      </form>
    </>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", maxWidth: "900px" }}>
      
      {embedded ? (
        <div style={{ padding: 0 }}>
          {formContent}
        </div>
      ) : (
        <section className="panel" style={{ padding: "32px", borderRadius: "24px" }}>
          {formContent}
        </section>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {rows.map(x => (
          <div key={x.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: x.completedAt ? "#f8fafc" : "#fff", borderRadius: "16px", border: "1px solid", borderColor: x.completedAt ? "#e2e8f0" : "#cbd5e1", opacity: x.completedAt ? 0.7 : 1, transition: "all 0.2s" }} className={!x.completedAt ? "hover-shadow" : ""}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button 
                onClick={() => done(x.id, !x.completedAt)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: x.completedAt ? "#16a34a" : "#cbd5e1" }}
                title={x.completedAt ? "Tamamlandı" : "Tamamla"}
              >
                {x.completedAt ? <CheckCircle size={32} weight="fill" /> : <Circle size={32} weight="bold" />}
              </button>
              
              <div style={{ padding: "10px", background: x.completedAt ? "#f1f5f9" : "#e0f2fe", color: x.completedAt ? "#94a3b8" : "#0284c7", borderRadius: "12px" }}>
                {getIcon(x.kind)}
              </div>

              <div>
                <strong style={{ display: "block", color: x.completedAt ? "#64748b" : "#0f172a", fontSize: "15px", textDecoration: x.completedAt ? "line-through" : "none", marginBottom: "4px" }}>
                  {x.title}
                </strong>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#64748b" }}>
                  <span style={{ fontWeight: 600, color: "#475569" }}>{new Date(x.startsAt).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  <span>•</span>
                  <span>{getLabel(x.kind)}</span>
                  <span>•</span>
                  <span>{doctorMode ? x.patient?.name : x.doctor?.name}</span>
                  {x.carePlan?.title && (
                    <>
                      <span>•</span>
                      <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: 500, color: "#475569" }}>{x.carePlan.title}</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
        {!rows.length && (
          <div style={{ padding: "48px", textAlign: "center", background: "#f8fafc", borderRadius: "24px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
            <CalendarCheck size={48} weight="duotone" color="#cbd5e1" style={{ margin: "0 auto 16px" }} />
            <p style={{ margin: 0, fontSize: "15px" }}>Takvimde henüz planlanmış bir ortak bakım görevi yok.</p>
          </div>
        )}
      </div>
    </div>
  );
}
