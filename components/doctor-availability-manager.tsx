"use client";
import { useEffect, useState } from "react";
import { appointmentPlaceLabel } from "@/lib/home-care";
import { Plus, Trash, CalendarBlank, Clock, VideoCamera, Storefront, FirstAidKit, MapPin } from "@phosphor-icons/react";

type Slot = { id: string; startsAt: string; endsAt: string; type: string };

export default function DoctorAvailabilityManager() {
  const [items, setItems] = useState<Slot[]>([]);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  async function load() {
    const response = await fetch("/api/doctor/availability");
    if (response.ok) setItems(await response.json());
  }

  useEffect(() => { load(); }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    const date = String(data.get("date"));
    const start = String(data.get("start"));
    const end = String(data.get("end"));
    
    const response = await fetch("/api/doctor/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startsAt: new Date(`${date}T${start}:00`).toISOString(),
        endsAt: new Date(`${date}T${end}:00`).toISOString(),
        type: data.get("type"),
      }),
    });
    
    if (response.ok) {
      setMsg({ type: "success", text: "Müsaitlik başarıyla eklendi." });
      form.reset();
      load();
    } else {
      const body = await response.json();
      setMsg({ type: "error", text: body.error || "Eklenemedi" });
    }
    setLoading(false);
  }

  async function removeSlot(id: string) {
    if (!confirm("Bu saat aralığını silmek istediğinize emin misiniz?")) return;
    const response = await fetch(`/api/doctor/availability?id=${id}`, { method: "DELETE" });
    if (response.ok) {
      load();
    } else {
      setMsg({ type: "error", text: "Silinirken bir hata oluştu." });
    }
  }

  const getTypeIcon = (type: string) => {
    switch(type) {
      case "online": return <VideoCamera size={16} weight="fill" />;
      case "clinic": return <Storefront size={16} weight="fill" />;
      case "home": return <FirstAidKit size={16} weight="fill" />;
      default: return <MapPin size={16} weight="fill" />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px", background: "#f8fafc", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Tarih *</label>
            <div style={{ position: "relative" }}>
              <CalendarBlank size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
              <input type="date" name="date" required style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", fontFamily: "inherit" }} />
            </div>
          </div>
          
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Başlangıç *</label>
            <div style={{ position: "relative" }}>
              <Clock size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
              <input type="time" name="start" required style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", fontFamily: "inherit" }} />
            </div>
          </div>
          
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Bitiş *</label>
            <div style={{ position: "relative" }}>
              <Clock size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
              <input type="time" name="end" required style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", fontFamily: "inherit" }} />
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Görüşme Türü *</label>
          <select name="type" defaultValue="both" style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", fontFamily: "inherit", background: "#fff" }}>
            <option value="both">Online + Klinik</option>
            <option value="online">Sadece Online</option>
            <option value="clinic">Sadece Klinik</option>
            <option value="home">Evde Ziyaret</option>
          </select>
        </div>

        <button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", borderRadius: "10px", background: "#2563eb", color: "#fff", border: "none", fontWeight: 600, fontSize: "15px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "background 0.2s", marginTop: "4px" }}>
          <Plus size={20} weight="bold" />
          {loading ? "Ekleniyor..." : "Saat Aralığını Aç"}
        </button>

        {msg.text && (
          <div style={{ padding: "12px 16px", borderRadius: "10px", background: msg.type === "success" ? "#ecfdf5" : "#fef2f2", color: msg.type === "success" ? "#047857" : "#b91c1c", fontSize: "14px", fontWeight: 500, textAlign: "center" }}>
            {msg.text}
          </div>
        )}
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <h3 style={{ fontSize: "14px", color: "#64748b", margin: "0 0 4px 0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Açık Olan Saatler</h3>
        {items.map((slot) => (
          <div key={slot.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", transition: "all 0.2s" }} className="hover-shadow">
            <div>
              <b style={{ display: "block", color: "#0f172a", fontSize: "15px", marginBottom: "4px" }}>
                {new Date(slot.startsAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "short" })}
              </b>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", color: "#64748b" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 600, color: "#334155" }}>
                  <Clock size={14} weight="bold" />
                  {new Date(slot.startsAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} – {new Date(slot.endsAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", background: "#f1f5f9", borderRadius: "6px", fontWeight: 500 }}>
                  {getTypeIcon(slot.type)}
                  {slot.type === "both" ? "Online + Klinik" : appointmentPlaceLabel(slot.type)}
                </span>
              </div>
            </div>
            <button 
              onClick={() => removeSlot(slot.id)}
              style={{ background: "#fef2f2", color: "#ef4444", border: "none", width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s" }}
              title="Saat aralığını sil"
            >
              <Trash size={18} weight="duotone" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
            <CalendarBlank size={32} weight="duotone" style={{ margin: "0 auto 12px" }} color="#cbd5e1" />
            <p style={{ margin: 0, fontSize: "14px" }}>Henüz açılmış bir müsaitlik saati bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
}
