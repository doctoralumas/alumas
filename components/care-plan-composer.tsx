"use client";
import { useState } from "react";
import { Notepad, User, Info, CalendarPlus, PaperPlaneRight, Pill } from "@phosphor-icons/react";

export default function CarePlanComposer({ patients }: { patients: { id: string; name: string }[] }) {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const f = new FormData(form);
    
    const r = await fetch('/api/care-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: f.get('patientId'),
        title: f.get('title'),
        summary: f.get('summary'),
        items: [{
          kind: 'instruction',
          title: f.get('itemTitle'),
          instructions: f.get('instructions'),
          schedule: f.get('schedule')
        }]
      })
    });
    
    const j = await r.json();
    setMsg(r.ok ? 'Bakım planı hastaya başarıyla gönderildi.' : j.error || 'Kaydedilemedi');
    setLoading(false);
    if (r.ok) form.reset();
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Hasta Seçimi *</label>
        <div style={{ position: "relative" }}>
          <User size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
          <select name="patientId" required style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", appearance: "none", background: "#fff", color: "#0f172a", fontSize: "14px" }}>
            <option value="">Hasta seçin</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Plan Başlığı *</label>
        <div style={{ position: "relative" }}>
          <Notepad size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
          <input name="title" placeholder="Örn: Diyabet 3 Aylık Takip Planı" required style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px" }} />
        </div>
      </div>

      <div>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Kısa Açıklama (Opsiyonel)</label>
        <div style={{ position: "relative" }}>
          <Info size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "14px" }} />
          <textarea name="summary" placeholder="Hastanın plan hakkındaki genel bilgilendirmesi..." rows={2} style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", resize: "vertical", fontSize: "14px" }} />
        </div>
      </div>

      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", marginTop: "8px" }}>
        <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
          <Pill size={18} color="#3b82f6" weight="duotone" />
          İlk Görev / Talimat Ekle
        </h4>
        <div style={{ display: "grid", gap: "12px" }}>
          <input name="itemTitle" placeholder="Örn. Sabah İlacı / Akşam Yürüyüşü" required style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px" }} />
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <input name="instructions" placeholder="Özel Talimatlar (Örn: Tok karnına)" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px" }} />
            <input name="schedule" placeholder="Sıklık (Örn: Günde 2 kez)" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px" }} />
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", borderRadius: "10px", background: "#0f172a", color: "#fff", border: "none", fontWeight: 600, fontSize: "15px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "background 0.2s", marginTop: "8px" }}>
        <PaperPlaneRight size={20} weight="fill" />
        {loading ? 'Gönderiliyor...' : 'Planı Hastaya Gönder'}
      </button>

      {msg && (
        <div style={{ padding: "12px", borderRadius: "10px", background: msg.includes('başarıyla') ? '#ecfdf5' : '#fef2f2', color: msg.includes('başarıyla') ? '#047857' : '#b91c1c', fontSize: "14px", fontWeight: 500, textAlign: "center" }}>
          {msg}
        </div>
      )}
    </form>
  );
}
