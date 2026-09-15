"use client";
import {useEffect,useState} from "react";
import { FileText, ShieldCheck, Heartbeat, Megaphone, CheckCircle, WarningCircle, ShieldWarning, LockKey } from "@phosphor-icons/react";

type C={kind:string;accepted:boolean;version:string};

const items=[
 {
   kind: "privacy_notice",
   title: "Aydınlatma Metni",
   desc: "Alumas'ın hangi kişisel verileri hangi amaçlarla işlediğini ve yasal haklarınızı açıklar.",
   required: true,
   icon: FileText,
   color: "#3b82f6"
 },
 {
   kind: "health_processing",
   title: "Sağlık Verisi İşleme",
   desc: "Özel nitelikli sağlık verilerinizin klinik teşhis ve tedavi hizmetleri için işlenmesini sağlar.",
   required: true,
   icon: ShieldCheck,
   color: "#8b5cf6"
 },
 {
   kind: "health_integrations",
   title: "Cihaz Entegrasyonları",
   desc: "Telefonunuzdaki seçili sağlık verilerini (Apple Health / Health Connect) Alumas'a aktarın.",
   required: false,
   icon: Heartbeat,
   color: "#f59e0b"
 },
 {
   kind: "marketing",
   title: "Kampanya ve İletişim",
   desc: "Size özel pazarlama amaçlı elektronik ileti, teklif ve bülten gönderimine izin verin.",
   required: false,
   icon: Megaphone,
   color: "#ec4899"
 }
];

export default function PrivacyCenter(){
  const [rows,setRows]=useState<C[]>([]);
  const [busy,setBusy]=useState("");

  const load=()=>fetch('/api/privacy/consents').then(r=>r.json()).then(setRows);
  useEffect(()=>{load()},[]);

  const latest=(k:string)=>rows.find(x=>x.kind===k)?.accepted??false;

  async function save(kind:string,accepted:boolean){
    // Zorunlu olanları iptal etmeyi engellemek için front-end kontrolü (ekstra güvenlik)
    const isRequired = items.find(x => x.kind === kind)?.required;
    if(isRequired && !accepted) return;

    setBusy(kind);
    await fetch('/api/privacy/consents',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({kind,accepted,version:'2026-08-21'})
    });
    await load();
    setBusy("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Gizlilik Güvencesi Bilgi Notu */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", background: "#f8fafc", padding: "16px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <LockKey size={24} weight="duotone" color="#64748b" style={{ flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>
          Alumas, kişisel verilerinizi uçtan uca şifreleme ve en yüksek güvenlik standartlarıyla korur. Gizlilik ayarlarınızı dilediğiniz an buradan yönetebilirsiniz. 
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {items.map(i => {
          const isAccepted = latest(i.kind);
          const isBusy = busy === i.kind;
          const Icon = i.icon;

          return (
            <div key={i.kind} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "24px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                
                <div style={{ display: "flex", gap: "16px", flex: 1, minWidth: "250px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: `${i.color}15`, color: i.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={24} weight="duotone" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ fontSize: "16px", color: "#0f172a" }}>{i.title}</strong>
                      {i.required && (
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#b91c1c", background: "#fef2f2", padding: "2px 8px", borderRadius: "100px", border: "1px solid #fecaca" }}>ZORUNLU</span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>{i.desc}</p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", alignSelf: "center" }}>
                  {i.required ? (
                    isAccepted ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#059669", background: "#ecfdf5", padding: "8px 16px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, border: "1px solid #d1fae5" }}>
                        <CheckCircle weight="fill" size={20} /> Okundu ve Onaylandı
                      </div>
                    ) : (
                      <button 
                        onClick={() => save(i.kind, true)}
                        disabled={isBusy}
                        style={{ padding: "10px 24px", background: "#0f172a", color: "#fff", borderRadius: "12px", border: "none", fontWeight: 600, fontSize: "14px", cursor: "pointer", transition: "all 0.2s", opacity: isBusy ? 0.7 : 1 }}
                      >
                        {isBusy ? "İşleniyor..." : "Onayla"}
                      </button>
                    )
                  ) : (
                    <>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: isAccepted ? "#10b981" : "#94a3b8" }}>
                        {isAccepted ? "Açık" : "Kapalı"}
                      </span>
                      <button 
                        onClick={() => save(i.kind, !isAccepted)}
                        disabled={isBusy}
                        style={{ position: "relative", width: "52px", height: "28px", borderRadius: "100px", background: isAccepted ? "#10b981" : "#cbd5e1", border: "none", cursor: "pointer", transition: "background 0.3s", opacity: isBusy ? 0.7 : 1 }}
                      >
                        <div style={{ position: "absolute", top: "2px", left: isAccepted ? "26px" : "2px", width: "24px", height: "24px", background: "#fff", borderRadius: "50%", transition: "left 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                      </button>
                    </>
                  )}
                </div>

              </div>
              
              {!isAccepted && i.required && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#b91c1c", fontSize: "13px", paddingLeft: "64px" }}>
                  <ShieldWarning size={16} weight="fill" /> Hizmetleri kullanabilmek için onaylamanız gerekmektedir.
                </div>
              )}

            </div>
          );
        })}
      </div>
      
    </div>
  );
}
