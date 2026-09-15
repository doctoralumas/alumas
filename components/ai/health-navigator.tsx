"use client";

import { FormEvent, useState, useRef, useEffect } from "react";
import { ShieldCheck, Stethoscope, CalendarBlank, MapPin, Sparkle, User, PaperPlaneRight, WarningCircle, CheckCircle, ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";

const prompts = ["3 gündür başım ağrıyor", "Çocuğumun ateşi var, ne yapmalıyım?", "Dahiliye doktoru arıyorum", "Tahlil sonuçlarımı yorumla"];

export default function HealthNavigator({ compact = false }: { compact?: boolean }) {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  
  const [personalize, setPersonalize] = useState(false);
  const [useAgent, setUseAgent] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = inputRef.current.scrollHeight + "px";
    }
  }, [message]);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (message.trim().length < 3) return;
    setLoading(true);
    setError("");
    try {
      const endpoint = useAgent ? "/api/ai/agent" : "/api/ai/navigate";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, history, personalize })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "İstek tamamlanamadı");
      setResult(json.data);
      setHistory(h => [...h, { role: "user" as const, text: message }, { role: "assistant" as const, text: json.data.commentary }].slice(-8));
      setMessage(""); // Clear input after submit
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", width: "100%" }}>
      
      {/* Header / Greeting */}
      {!result && !loading && !compact && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "64px 0 32px 0", animation: "fadeIn 0.5s ease-out" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", marginBottom: "24px", boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)" }}>
            <Sparkle size={40} weight="fill" />
          </div>
          <h1 style={{ fontSize: "36px", color: "#0f172a", margin: "0 0 16px 0", fontWeight: 800, letterSpacing: "-1px" }}>
            Ben Luma. Size nasıl yardımcı olabilirim?
          </h1>
          <p style={{ margin: 0, fontSize: "16px", color: "#64748b", maxWidth: "500px" }}>
            Şikayetinizi veya ihtiyacınızı doğal bir şekilde yazın. Sizi en doğru uzman, kurum veya sağlık servisine yönlendireyim.
          </p>
        </div>
      )}

      {/* Input Area */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: compact ? "100%" : "760px", margin: "0 auto", transition: "all 0.3s ease" }}>
        
        <form onSubmit={submit} style={{ position: "relative", display: "flex", flexDirection: "column", background: "#fff", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05)", transition: "all 0.2s" }}>
          <textarea
            ref={inputRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mesajınızı Luma'ya iletin..."
            rows={1}
            style={{ width: "100%", padding: "20px 64px 20px 24px", border: "none", borderRadius: "24px", background: "transparent", fontSize: "16px", color: "#0f172a", outline: "none", resize: "none", minHeight: "64px", maxHeight: "200px", fontFamily: "inherit", lineHeight: "1.5" }}
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading || message.trim().length < 3}
            style={{ position: "absolute", right: "12px", bottom: "12px", width: "40px", height: "40px", borderRadius: "16px", background: message.trim().length >= 3 ? "#0f172a" : "#f1f5f9", color: message.trim().length >= 3 ? "#fff" : "#94a3b8", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: message.trim().length >= 3 ? "pointer" : "not-allowed", transition: "all 0.2s" }}
          >
            {loading ? <div className="spinner" style={{ width: "18px", height: "18px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> : <PaperPlaneRight size={20} weight="fill" />}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", padding: "0 8px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: personalize ? "#0ea5e9" : "#64748b", cursor: "pointer", transition: "color 0.2s" }}>
              <input type="checkbox" checked={personalize} onChange={e => setPersonalize(e.target.checked)} style={{ accentColor: "#0ea5e9", width: "16px", height: "16px", cursor: "pointer" }} />
              <User size={16} weight={personalize ? "bold" : "regular"} /> Sağlık profilimi kullan
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: useAgent ? "#8b5cf6" : "#64748b", cursor: "pointer", transition: "color 0.2s" }}>
              <input type="checkbox" checked={useAgent} onChange={e => setUseAgent(e.target.checked)} style={{ accentColor: "#8b5cf6", width: "16px", height: "16px", cursor: "pointer" }} />
              <Sparkle size={16} weight={useAgent ? "fill" : "regular"} /> Luma AI+ (Agent Modu)
            </label>
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
            <ShieldCheck size={14} /> Şifrelenmiş Uçtan Uca Gizlilik
          </div>
        </div>

      </div>

      {/* Suggestion Chips */}
      {!result && !loading && !compact && (
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px", maxWidth: "760px", margin: "0 auto" }}>
          {prompts.map(p => (
            <button 
              key={p} 
              onClick={() => setMessage(p)} 
              type="button"
              style={{ padding: "10px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "100px", fontSize: "14px", color: "#475569", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}
              onMouseOver={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
              onMouseOut={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div style={{ maxWidth: "760px", margin: "0 auto", width: "100%", padding: "16px", background: "#fef2f2", color: "#ef4444", borderRadius: "16px", border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: 500 }}>
          <WarningCircle size={20} weight="fill" /> {error}
        </div>
      )}

      {/* Results Area */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "760px", margin: "0 auto", width: "100%", animation: "fadeInUp 0.5s ease-out" }}>
          
          {/* Luma's Response Message */}
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
              <Sparkle size={18} weight="fill" />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", paddingTop: "8px" }}>
              <p style={{ margin: 0, fontSize: "16px", color: "#0f172a", lineHeight: "1.6" }}>{result.summary}</p>
              
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "16px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#475569", lineHeight: "1.6" }}>
                {result.commentary}
              </div>

              {result.personalization?.enabled && result.personalization.note && (
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "#0369a1", background: "#f0f9ff", padding: "12px", borderRadius: "12px", border: "1px solid #bae6fd" }}>
                  <User size={16} weight="duotone" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ display: "block", marginBottom: "2px" }}>Kişiselleştirme devrede</strong>
                    {result.personalization.note}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Doctors List */}
          {result.doctors && result.doctors.length > 0 && (
            <div style={{ marginLeft: "52px" }}>
              <h3 style={{ fontSize: "15px", color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Stethoscope size={18} color="#3b82f6" /> Önerilen Doğrulanmış Uzmanlar
              </h3>
              <div style={{ display: "grid", gap: "12px" }}>
                {result.doctors.map((d: any) => (
                  <Link key={d.id} href={`/doctors/${d.slug}`} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", textDecoration: "none", color: "inherit", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.borderColor = "#cbd5e1"} onMouseOut={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", fontWeight: 700, fontSize: "15px", flexShrink: 0 }}>
                      {d.name.split(" ").slice(-2).map((x: string) => x[0]).join("").slice(0, 2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: "block", fontSize: "15px", color: "#0f172a", marginBottom: "2px" }}>{d.title} {d.name}</strong>
                      <span style={{ fontSize: "13px", color: "#64748b" }}>{d.specialty} • {d.organization?.name || d.hospital}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f8fafc", padding: "8px 12px", borderRadius: "100px", fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                      Profili Gör <ArrowRight size={14} weight="bold" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Organizations List */}
          {result.organizations && result.organizations.length > 0 && (
            <div style={{ marginLeft: "52px" }}>
              <h3 style={{ fontSize: "15px", color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin size={18} color="#10b981" /> Uygun Sağlık Kurumları
              </h3>
              <div style={{ display: "grid", gap: "12px" }}>
                {result.organizations.map((o: any) => (
                  <Link key={o.id} href={`/organizations/${o.slug}`} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", textDecoration: "none", color: "inherit" }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: "block", fontSize: "15px", color: "#0f172a", marginBottom: "2px" }}>{o.name}</strong>
                      <span style={{ fontSize: "13px", color: "#64748b" }}>{o.city}{o.district ? `, ${o.district}` : ""}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f8fafc", padding: "8px 12px", borderRadius: "100px", fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                      İncele <ArrowRight size={14} weight="bold" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Follow up actions */}
          {result.followUps && result.followUps.length > 0 && (
            <div style={{ marginLeft: "52px", marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {result.followUps.map((q: string) => (
                <button 
                  key={q} 
                  onClick={() => { setMessage(q); submit(); }}
                  style={{ padding: "8px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "100px", fontSize: "13px", color: "#3b82f6", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Emergency Triage */}
          {result.intent?.triage === "emergency" && (
            <div style={{ marginLeft: "52px", background: "#fef2f2", padding: "16px", borderRadius: "16px", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#dc2626", fontWeight: 600 }}>
                <WarningCircle size={24} weight="fill" /> Acil Tıbbi Durum Şüphesi
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <a href="tel:112" style={{ padding: "10px 20px", background: "#dc2626", color: "#fff", borderRadius: "12px", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>112'yi Ara</a>
                <Link href="/nearby" style={{ padding: "10px 20px", background: "#fff", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "12px", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>En Yakın Acil</Link>
              </div>
            </div>
          )}

          {/* Sources panel */}
          {result.sources && result.sources.length > 0 && (
            <div style={{ marginLeft: "52px", marginTop: "16px" }}>
              <div style={{ fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>
                <CheckCircle size={14} weight="fill" /> Kullanılan Kaynaklar
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {result.sources.map((src: any) => (
                  <div key={src.id} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", background: "#f1f5f9", borderRadius: "6px", fontSize: "12px", color: "#475569" }}>
                    <ShieldCheck size={12} weight="fill" color="#10b981" /> {src.label}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
