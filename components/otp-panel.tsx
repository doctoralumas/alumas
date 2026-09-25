"use client";
import {useState} from "react";
import { DeviceMobile, CheckCircle, WarningCircle, ArrowRight } from "@phosphor-icons/react";

export default function OtpPanel(){
  const [phone,setPhone]=useState('');
  const [code,setCode]=useState('');
  const [devCode,setDevCode]=useState('');
  const [msg,setMsg]=useState('');
  const [step,setStep]=useState(1);

  async function request(){
    setMsg('');
    const r=await fetch('/api/auth/otp/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone})});
    const j=await r.json();
    if(!r.ok) return setMsg(j.error||'Kod gönderilemedi');
    if(j.devCode) setDevCode(j.devCode);
    setMsg('Doğrulama kodu gönderildi.');
    setStep(2);
  }

  async function verify(){
    const r=await fetch('/api/auth/otp/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,code})});
    const j=await r.json();
    if (r.ok) {
      setMsg('Telefon doğrulandı.');
      setStep(3);
    } else {
      setMsg(j.error||'Doğrulama başarısız');
    }
  }

  if(step === 3) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#ecfdf5", padding: "16px 20px", borderRadius: "16px", border: "1px solid #d1fae5" }}>
        <CheckCircle size={24} weight="fill" color="#10b981" />
        <div>
          <strong style={{ display: "block", color: "#065f46", fontSize: "15px" }}>Telefon Onaylandı</strong>
          <span style={{ fontSize: "14px", color: "#059669" }}>{phone}</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      
      {step === 1 && (
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <DeviceMobile size={20} color="#94a3b8" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
            <input 
              value={phone} 
              onChange={e=>setPhone(e.target.value)} 
              placeholder="555 123 45 67"
              style={{ width: "100%", padding: "14px 16px 14px 48px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a" }}
            />
          </div>
          <button onClick={request} disabled={!phone} style={{ padding: "0 24px", background: phone ? "#0f172a" : "#cbd5e1", color: "#fff", borderRadius: "16px", border: "none", fontWeight: 600, fontSize: "14px", cursor: phone ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
            Devam <ArrowRight size={16} weight="bold" style={{ verticalAlign: "middle", marginLeft: "4px" }} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <input 
              value={code} 
              onChange={e=>setCode(e.target.value)} 
              placeholder="6 Haneli Kod" 
              inputMode="numeric" 
              maxLength={6}
              style={{ flex: 1, padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a", letterSpacing: "2px", textAlign: "center" }}
            />
            <button onClick={verify} disabled={code.length < 6} style={{ padding: "0 24px", background: code.length >= 6 ? "#0f172a" : "#cbd5e1", color: "#fff", borderRadius: "16px", border: "none", fontWeight: 600, fontSize: "14px", cursor: code.length >= 6 ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
              Doğrula
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>{phone} numarasına gönderildi.</span>
            <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Geri Dön</button>
          </div>
        </div>
      )}

      {devCode && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fef3c7", color: "#d97706", padding: "12px 16px", borderRadius: "12px", fontSize: "14px" }}>
          <WarningCircle size={20} weight="fill" /> Dev Code: <strong>{devCode}</strong>
        </div>
      )}

      {msg && !msg.includes('gönderildi') && (
        <div style={{ fontSize: "13px", color: msg.includes('başarısız') ? "#ef4444" : "#10b981", fontWeight: 500 }}>
          {msg}
        </div>
      )}
      
    </div>
  )
}
