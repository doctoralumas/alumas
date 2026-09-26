"use client";
import {useState} from "react";
import { WarningCircle, DownloadSimple, Trash } from "@phosphor-icons/react";

export default function AccountControls(){
  const [confirm,setConfirm]=useState("");
  const [password,setPassword]=useState("");
  const [msg,setMsg]=useState("");
  const [loading,setLoading]=useState(false);

  async function del(){
    if(!window.confirm('Bu işlem geri alınamaz. Hesabı silmek istiyor musunuz?')) return;
    setLoading(true);
    const r=await fetch('/api/account/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({confirmation:confirm,password})});
    const d=await r.json();
    if(!r.ok) {
      setMsg(d.error||'Silinemedi');
      setLoading(false);
      return;
    }
    location.href='/';
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", color: "#0f172a" }}>
          <DownloadSimple size={24} weight="duotone" color="#0ea5e9" />
          <h2 style={{ margin: 0, fontSize: "20px" }}>Verileri Dışa Aktar</h2>
        </div>
        <a 
          href="/api/account/export"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 24px", background: "#f1f5f9", color: "#0f172a", borderRadius: "100px", textDecoration: "none", fontWeight: 600, fontSize: "14px", border: "1px solid #e2e8f0" }}
        >
          Tüm Sağlık ve Hesap Verilerimi İndir
        </a>
      </div>

      <div style={{ height: "1px", background: "#e2e8f0" }} />

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", color: "#b91c1c" }}>
          <WarningCircle size={24} weight="duotone" />
          <h2 style={{ margin: 0, fontSize: "20px" }}>Tehlikeli Bölge</h2>
        </div>
        <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
          Sağlık belgeleri dahil hesabınıza bağlı tüm veriler silinir. Yasal saklama yükümlülükleri bulunan üretim senaryoları için verileriniz yasal süre boyunca arşivde şifreli tutulabilir.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input 
            value={confirm} 
            onChange={e=>setConfirm(e.target.value)} 
            placeholder="HESABIMI SİL yazın"
            style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #fecaca", background: "#fff", outline: "none", fontSize: "14px", color: "#0f172a" }}
          />
          <input 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            placeholder="Parola (varsa)" 
            type="password"
            style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #fecaca", background: "#fff", outline: "none", fontSize: "14px", color: "#0f172a" }}
          />
          <button 
            onClick={del}
            disabled={confirm !== 'HESABIMI SİL' || loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 24px", background: confirm === 'HESABIMI SİL' ? "#ef4444" : "#fca5a5", color: "#fff", borderRadius: "12px", border: "none", fontWeight: 600, fontSize: "14px", cursor: confirm === 'HESABIMI SİL' ? "pointer" : "not-allowed", transition: "all 0.2s" }}
          >
            <Trash size={18} weight="bold" /> {loading ? "Siliniyor..." : "Hesabımı Kalıcı Olarak Sil"}
          </button>
          {msg && <div style={{ fontSize: "13px", color: "#ef4444", fontWeight: 500, marginTop: "4px" }}>{msg}</div>}
        </div>
      </div>

    </div>
  )
}
