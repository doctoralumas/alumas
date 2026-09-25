'use client';
import { useState } from 'react';
import { CheckCircle, MapPin, VideoCamera, Storefront, FirstAidKit, User, CalendarBlank } from "@phosphor-icons/react";

type A = { id: string; patientName: string; startsAt: string; type: string; visitDistrict?: string | null; visitAddress?: string | null };

export default function DoctorCompletionList({ initial }: { initial: A[] }) {
  const [rows, setRows] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  async function complete(id: string) {
    if (!confirm('Bu görüşmeyi tamamlandı olarak işaretlemek istiyor musun?')) return;
    setLoading(id);
    const r = await fetch(`/api/appointments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'complete' }) });
    if (r.ok) {
      setRows(x => x.filter(a => a.id !== id));
    } else {
      alert((await r.json()).error || 'İşlem başarısız');
    }
    setLoading(null);
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "online": return <VideoCamera size={16} weight="fill" />;
      case "clinic": return <Storefront size={16} weight="fill" />;
      case "home": return <FirstAidKit size={16} weight="fill" />;
      default: return <MapPin size={16} weight="fill" />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {rows.map(a => (
        <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", transition: "all 0.2s" }} className="hover-shadow">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f8fafc", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={20} weight="duotone" />
            </div>
            <div>
              <b style={{ display: "block", color: "#0f172a", fontSize: "15px", marginBottom: "4px" }}>{a.patientName}</b>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#64748b" }}>
                <span style={{ fontWeight: 600, color: "#475569" }}>
                  {new Date(a.startsAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", background: a.type === 'home' ? '#fef2f2' : a.type === 'online' ? '#eff6ff' : '#f0fdf4', color: a.type === 'home' ? '#ef4444' : a.type === 'online' ? '#3b82f6' : '#16a34a', borderRadius: "6px", fontWeight: 500 }}>
                  {getTypeIcon(a.type)}
                  {a.type === 'home' ? 'Evde' : a.type === 'online' ? 'Online' : 'Klinik'}
                </span>
                {a.type === 'home' && a.visitAddress && (
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    • <MapPin size={12} weight="bold" /> {[a.visitDistrict, a.visitAddress].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={() => complete(a.id)}
            disabled={loading === a.id}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "#10b981", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 600, fontSize: "13px", cursor: loading === a.id ? "not-allowed" : "pointer", opacity: loading === a.id ? 0.7 : 1, transition: "background 0.2s" }}
          >
            <CheckCircle size={18} weight="bold" />
            {loading === a.id ? "Bekleyin..." : "Tamamlandı"}
          </button>
        </div>
      ))}
      {!rows.length && (
        <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
          <CalendarBlank size={32} weight="duotone" style={{ margin: "0 auto 12px" }} color="#cbd5e1" />
          <p style={{ margin: 0, fontSize: "14px" }}>Tamamlanmayı bekleyen geçmiş görüşme yok.</p>
        </div>
      )}
    </div>
  );
}
